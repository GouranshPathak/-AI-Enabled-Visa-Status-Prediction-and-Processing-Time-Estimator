"""
Flask Backend for AI Visa Processing Time Estimator
Serves the trained ML model and provides prediction API
"""

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import joblib
import numpy as np
import os
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__, 
            template_folder='../templates',
            static_folder='../static')

# Enable CORS for all routes
CORS(app)

# Global variable to store the loaded model
model = None

# ===================================
# Configuration
# ===================================

# Path to the trained model
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'model', 'visa_processing_time_model.pkl')

# Default country processing times (in days)
COUNTRY_AVG_PROCESSING_TIMES = {
    'united states': 60,
    'usa': 60,
    'canada': 45,
    'united kingdom': 50,
    'uk': 50,
    'australia': 55,
    'germany': 40,
    'france': 42,
    'japan': 35,
    'singapore': 30,
    'india': 65,
    'china': 55,
    'default': 50  # Fallback for unknown countries
}

# Seasonal index mapping based on purpose of travel
SEASONAL_INDEX_MAP = {
    'tourism': 1.2,      # Higher demand in tourist seasons
    'business': 1.0,     # Consistent throughout year
    'study': 1.3,        # Peak during admission seasons
    'work': 1.1,         # Moderate seasonal variation
    'medical': 0.9,      # Lower seasonal impact
    'family': 1.0        # Consistent throughout year
}

# ===================================
# Model Loading
# ===================================

def load_model():
    """Load the trained ML model from disk"""
    global model
    try:
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
            logger.info(f"Model loaded successfully from {MODEL_PATH}")
        else:
            logger.warning(f"Model file not found at {MODEL_PATH}. Using mock predictions.")
            model = None
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        model = None

# Load model on startup
load_model()

# ===================================
# Preprocessing Functions
# ===================================

def get_seasonal_index(purpose_of_travel):
    """
    Calculate seasonal index based on purpose of travel
    
    Args:
        purpose_of_travel (str): Purpose of travel
        
    Returns:
        float: Seasonal index multiplier
    """
    return SEASONAL_INDEX_MAP.get(purpose_of_travel.lower(), 1.0)

def calculate_risk_score(previous_rejections, document_completeness):
    """
    Calculate risk score based on previous rejections and document completeness
    
    Args:
        previous_rejections (int): Number of previous visa rejections
        document_completeness (int): Document completeness score (0-100)
        
    Returns:
        float: Risk score (0-10 scale)
    """
    # Higher rejections increase risk
    rejection_penalty = previous_rejections * 1.5
    
    # Lower document completeness increases risk
    completeness_factor = (100 - document_completeness) / 10
    
    # Calculate total risk score (capped at 10)
    risk_score = min(rejection_penalty + completeness_factor, 10.0)
    
    return round(risk_score, 2)

def get_country_avg_processing_time(country):
    """
    Get average processing time for a country
    
    Args:
        country (str): Target country name
        
    Returns:
        int: Average processing time in days
    """
    country_lower = country.lower().strip()
    return COUNTRY_AVG_PROCESSING_TIMES.get(country_lower, COUNTRY_AVG_PROCESSING_TIMES['default'])

def preprocess_input(data):
    """
    Preprocess input data and compute derived features
    
    Args:
        data (dict): Raw input data from frontend
        
    Returns:
        dict: Preprocessed data with all required features
    """
    # Extract base features
    age = data['age']
    purpose = data['purpose']
    category = data['category']
    country = data['country']
    previous_rejections = data['previous_rejections']
    document_completeness = data['document_completeness']
    sponsorship = data['sponsorship']
    
    # Compute derived features
    seasonal_index = get_seasonal_index(purpose)
    risk_score = calculate_risk_score(previous_rejections, document_completeness)
    country_avg_time = get_country_avg_processing_time(country)
    
    # Create feature dictionary
    features = {
        'age': age,
        'purpose_of_travel': purpose,
        'visa_category': category,
        'target_country': country,
        'previous_visa_rejections': previous_rejections,
        'document_completeness_score': document_completeness,
        'sponsorship_status': sponsorship,
        'seasonal_index': seasonal_index,
        'risk_score': risk_score,
        'country_avg_processing_time': country_avg_time
    }
    
    logger.info(f"Preprocessed features: {features}")
    return features

def prepare_model_input(features):
    """
    Prepare features for model prediction
    Note: This is a placeholder - adjust based on your actual model's expected input format
    
    Args:
        features (dict): Preprocessed features
        
    Returns:
        numpy.ndarray: Feature array ready for model prediction
    """
    # If your model expects specific feature order or encoding, implement it here
    # This is a simple example assuming numerical features in a specific order
    
    feature_array = np.array([[
        features['age'],
        features['previous_visa_rejections'],
        features['document_completeness_score'],
        features['sponsorship_status'],
        features['seasonal_index'],
        features['risk_score'],
        features['country_avg_processing_time']
    ]])
    
    return feature_array

# ===================================
# Mock Prediction (for testing without model)
# ===================================

def mock_prediction(features):
    """
    Generate a mock prediction when model is not available
    Uses a simple heuristic based on input features
    
    Args:
        features (dict): Preprocessed features
        
    Returns:
        float: Predicted processing time in days
    """
    base_time = features['country_avg_processing_time']
    
    # Adjust based on risk score
    risk_adjustment = features['risk_score'] * 2
    
    # Adjust based on seasonal index
    seasonal_adjustment = (features['seasonal_index'] - 1.0) * 10
    
    # Adjust based on sponsorship
    sponsorship_adjustment = -5 if features['sponsorship_status'] == 1 else 5
    
    # Calculate final prediction
    prediction = base_time + risk_adjustment + seasonal_adjustment + sponsorship_adjustment
    
    # Ensure prediction is positive and reasonable
    prediction = max(15, min(prediction, 120))
    
    return round(prediction, 1)

# ===================================
# Routes
# ===================================

@app.route('/')
def index():
    """Serve the main frontend page"""
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    """
    Prediction endpoint
    Accepts JSON input, processes it, and returns prediction
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['age', 'purpose', 'category', 'country', 
                          'previous_rejections', 'document_completeness', 'sponsorship']
        
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        
        # Validate data types and ranges
        try:
            age = int(data['age'])
            if age < 18 or age > 100:
                return jsonify({'error': 'Age must be between 18 and 100'}), 400
            
            previous_rejections = int(data['previous_rejections'])
            if previous_rejections < 0 or previous_rejections > 10:
                return jsonify({'error': 'Previous rejections must be between 0 and 10'}), 400
            
            document_completeness = int(data['document_completeness'])
            if document_completeness < 0 or document_completeness > 100:
                return jsonify({'error': 'Document completeness must be between 0 and 100'}), 400
            
            sponsorship = int(data['sponsorship'])
            if sponsorship not in [0, 1]:
                return jsonify({'error': 'Sponsorship must be 0 or 1'}), 400
                
        except (ValueError, TypeError) as e:
            return jsonify({'error': f'Invalid data type: {str(e)}'}), 400
        
        # Preprocess input
        features = preprocess_input(data)
        
        # Make prediction
        if model is not None:
            # Use actual trained model
            try:
                model_input = prepare_model_input(features)
                prediction = model.predict(model_input)[0]
                logger.info(f"Model prediction: {prediction}")
            except Exception as e:
                logger.error(f"Error during model prediction: {str(e)}")
                # Fallback to mock prediction
                prediction = mock_prediction(features)
                logger.info(f"Using mock prediction: {prediction}")
        else:
            # Use mock prediction
            prediction = mock_prediction(features)
            logger.info(f"Mock prediction (model not loaded): {prediction}")
        
        # Ensure prediction is a valid number
        prediction = float(prediction)
        prediction = max(1, round(prediction, 1))  # Minimum 1 day
        
        # Return response
        response = {
            'processing_time_days': prediction
        }
        
        logger.info(f"Returning prediction: {response}")
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error in /predict endpoint: {str(e)}")
        return jsonify({'error': 'An error occurred while processing your request'}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'timestamp': datetime.now().isoformat()
    }), 200

# ===================================
# Error Handlers
# ===================================

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({'error': 'Internal server error'}), 500

# ===================================
# Main
# ===================================

if __name__ == '__main__':
    logger.info("Starting Flask application...")
    logger.info(f"Template folder: {app.template_folder}")
    logger.info(f"Static folder: {app.static_folder}")
    logger.info(f"Model path: {MODEL_PATH}")
    
    # Run the Flask app
    # Run the Flask app
    port = int(os.environ.get('PORT', 5000))
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False # Set debug to False for production
    )
