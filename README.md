AI-Enabled Visa Status Prediction & Processing Time Estimator

This project is an AI-powered system that predicts visa processing time based on applicant details using Machine Learning.
It provides an interactive web interface for users to input their data and get estimated processing time.

📌 Project Overview

Visa processing time varies based on multiple factors such as country, purpose of travel, document completeness, and previous rejections.
This project uses Machine Learning models to predict the expected processing time and provides insights through a user-friendly interface.

🧠 Features

🎯 Predict visa processing time using ML model
🌍 Support for multiple target countries
📊 Interactive charts and visualizations
📱 Responsive modern UI
⚡ Real-time API integration
🧪 Input validation and error handling
🔄 Fallback mock prediction if model not available
☁️ Deployed on Render

🛠 Tech Stack

Frontend -

HTML
CSS
JavaScript

Backend -

Flask (Python)
REST API
Machine Learning
Python
Pandas, NumPy
Scikit-learn
Joblib
Deployment
Render

📂 Project Structure
AI-Enabled-Visa-Status-Prediction/
│
├── backend/
│   └── app.py
│
├── data/
│   ├── raw/
│   └── processed/
│
├── model/
│   └── visa_processing_time_model.pkl
│
├── notebooks/
│   ├── data_preprocessing.ipynb
│   ├── feature_engineering.ipynb
│   └── model_training.ipynb
│
├── static/
├── templates/
│   └── index.html
│
├── requirements.txt
├── runtime.txt
└── README.md


📊 Milestones
✅ Milestone 1: Data Collection & Preprocessing

Collected dataset from Kaggle
Dataset size: 120,000 rows, 21 columns
Removed irrelevant columns
Handled missing values
Corrected data types
Cleaned and stored dataset

📁 Output:
data/processed/visa_recommendation_cleaned.csv

✅ Milestone 2: Feature Engineering

Created derived features:
Risk Score
Seasonal Index
Country Average Processing Time
Converted categorical variables
Prepared dataset for ML models

📁 Output:
data/processed/visa_feature_engineered.csv

✅ Milestone 3: Model Training & Evaluation

Trained multiple ML models:
Linear Regression ✅ (Best Model)
Random Forest
Decision Tree
Evaluated models using performance metrics
Selected Linear Regression as best model

📁 Output:
model/visa_processing_time_model.pkl

✅ Milestone 4: Deployment & UI Development

Developed interactive frontend
Integrated backend API with model
Added visualizations (charts & graphs)
Implemented validation & error handling
Deployed application on Render

🔮 Model Details

Best Model: Linear Regression
Target Variable: Visa Processing Time (days)

Input Features:

Age
Purpose of Travel
Visa Category
Target Country
Previous Visa Rejections
Document Completeness Score
Sponsorship Status
Seasonal Index
Risk Score

Country Average Processing Time

🔗 API Endpoints - 

📌 Predict Processing Time - 

POST /predict
Request Example:
{
  "age": 25,
  "purpose": "tourism",
  "category": "short-term",
  "country": "Canada",
  "previous_rejections": 1,
  "document_completeness": 85,
  "sponsorship": 1
}
Response:
{
  "processing_time_days": 45.2
}

📌 Health Check - 

GET /health:

🚀 Deployment:

The application is deployed on Render using:
Python 3.10
Gunicorn server
Flask backend

Future Improvements -

Add visa approval prediction
Improve model accuracy
Add real-time data integration
Enhance UI/UX

📜 Conclusion -

This project demonstrates how Machine Learning + Web Development can be combined to solve real-world problems like visa processing estimation.