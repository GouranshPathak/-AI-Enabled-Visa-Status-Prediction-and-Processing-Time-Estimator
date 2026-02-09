// ===================================
// Configuration & State
// ===================================

const CONFIG = {
    API_ENDPOINT: '/predict',
    ANIMATION_DURATION: 2000,
    MIN_AGE: 18,
    MAX_AGE: 70,
    MAX_REJECTIONS: 5
};

const state = {
    isLoading: false,
    formData: {}
};

// ===================================
// DOM Elements
// ===================================

const form = document.getElementById('visaForm');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const spinner = document.getElementById('spinner');
const loadingText = document.querySelector('.loading-text');
const btnText = document.querySelector('.btn-text');
const resultCard = document.getElementById('resultCard');
const errorCard = document.getElementById('errorCard');
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');

// Inputs
const inputs = {
    age: document.getElementById('age'),
    country: document.getElementById('country'),
    purpose: document.getElementById('purpose'),
    category: document.getElementById('category'),
    rejections: document.getElementById('rejections'),
    sponsorship: document.getElementsByName('sponsorship'),
    completeness: document.getElementById('completeness')
};

// Error spans
const errors = {
    age: document.getElementById('age-error'),
    country: document.getElementById('country-error'),
    purpose: document.getElementById('purpose-error'),
    category: document.getElementById('category-error'),
    rejections: document.getElementById('rejections-error'),
    sponsorship: document.getElementById('sponsorship-error')
};

// ===================================
// Validation Rules
// ===================================

const validationRules = {
    age: {
        validate: (value) => {
            const age = parseInt(value);
            return age >= CONFIG.MIN_AGE && age <= CONFIG.MAX_AGE;
        },
        message: `Age must be between ${CONFIG.MIN_AGE} and ${CONFIG.MAX_AGE}`
    },
    country: {
        validate: (value) => value !== '' && value !== null,
        message: 'Please select a target country'
    },
    purpose: {
        validate: (value) => value !== '' && value !== null,
        message: 'Please select a purpose of travel'
    },
    category: {
        validate: (value) => value !== '' && value !== null,
        message: 'Please select a visa category'
    },
    rejections: {
        validate: (value) => {
            const rejections = parseInt(value);
            return rejections >= 0 && rejections <= CONFIG.MAX_REJECTIONS;
        },
        message: `Maximum ${CONFIG.MAX_REJECTIONS} previous rejections allowed`
    },
    sponsorship: {
        validate: () => {
            return Array.from(inputs.sponsorship).some(radio => radio.checked);
        },
        message: 'Please select sponsorship status'
    }
};

// ===================================
// Event Listeners
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    initializeDropdowns();
    updateCompletenessDisplay();
});

/**
 * Initialize Dropdowns (Select2)
 */
function initializeDropdowns() {
    // Check if jQuery and Select2 are loaded
    if (typeof $ !== 'undefined' && $.fn.select2) {
        $('#country').select2({
            placeholder: 'Select a country',
            allowClear: true,
            width: '100%' // Ensure full width
        });

        // Bind Select2 change event to validation logic
        $('#country').on('change', function () {
            validateField('country');
            checkFormValidity();
        });
    }
}

function initializeEventListeners() {
    // Form submission
    form.addEventListener('submit', handleFormSubmit);

    // Reset button
    resetBtn.addEventListener('click', resetForm);
    retryBtn.addEventListener('click', () => {
        errorCard.classList.remove('show');
        resultCard.classList.remove('show');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Input validation
    Object.keys(inputs).forEach(field => {
        if (field === 'sponsorship') {
            inputs[field].forEach(radio => {
                radio.addEventListener('change', () => {
                    validateField(field);
                    checkFormValidity();
                });
            });
        } else if (field === 'completeness') {
            inputs[field].addEventListener('input', updateCompletenessDisplay);
        } else if (field !== 'country') { // Country handled by Select2
            inputs[field].addEventListener('input', () => {
                validateField(field);
                checkFormValidity();
            });
            inputs[field].addEventListener('blur', () => {
                validateField(field);
            });
        }
    });
}

function updateCompletenessDisplay() {
    const value = inputs.completeness.value;
    const label = document.getElementById('completeness-label');
    const valueSpan = document.getElementById('completeness-value');

    valueSpan.textContent = value;

    // Update label text and style
    if (value < 40) {
        label.textContent = 'Incomplete';
        label.className = 'badge badge-warning';
        label.style.backgroundColor = '#fed7aa'; // Orange tint
        label.style.color = '#9a3412';
    } else if (value < 70) {
        label.textContent = 'Moderate';
        label.className = 'badge badge-warning';
        label.style.backgroundColor = '#fef3c7'; // Yellow tint
        label.style.color = '#92400e';
    } else {
        label.textContent = 'Complete';
        label.className = 'badge badge-warning'; // Keep base class for shape
        label.style.backgroundColor = '#d1fae5'; // Green tint
        label.style.color = '#065f46';
        label.style.borderColor = '#6ee7b7';
    }
}

// ===================================
// Validation Logic
// ===================================

function validateField(fieldName) {
    const rule = validationRules[fieldName];
    if (!rule) return true;

    let isValid = false;
    if (fieldName === 'sponsorship') {
        isValid = rule.validate();
    } else {
        // Handle Select2 value for country
        let value = inputs[fieldName].value;
        if (fieldName === 'country' && typeof $ !== 'undefined') {
            value = $('#country').val();
        }
        isValid = rule.validate(value);
    }

    const errorSpan = errors[fieldName];
    if (!isValid) {
        errorSpan.textContent = rule.message;
        inputs[fieldName].classList?.add('error'); // Use optional chaining for NodeList
    } else {
        errorSpan.textContent = '';
        inputs[fieldName].classList?.remove('error');
    }

    return isValid;
}

function validateForm() {
    let isValid = true;
    Object.keys(validationRules).forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    return isValid;
}

function checkFormValidity() {
    const isValid = Object.keys(validationRules).every(field => {
        if (field === 'sponsorship') {
            return validationRules[field].validate();
        }
        let value = inputs[field].value;
        if (field === 'country' && typeof $ !== 'undefined') {
            value = $('#country').val();
        }
        // Basic check without showing errors
        return validationRules[field].validate(value);
    });

    submitBtn.disabled = !isValid;
}

// ===================================
// Form Submission & Processing
// ===================================

async function handleFormSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
        // Scroll to first error
        const firstError = document.querySelector('.error-message:not(:empty)');
        if (firstError) {
            firstError.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    setLoadingState(true);
    resultCard.classList.remove('show');
    errorCard.classList.remove('show');

    // Collect data
    const formData = collectFormData();

    try {
        // Simulate minimum delay for UX (so user sees loading state)
        await new Promise(resolve => setTimeout(resolve, 1500));

        const response = await fetch(CONFIG.API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Prediction failed');
        }

        const data = await response.json();
        displayResult(data.processing_time_days, formData);

    } catch (error) {
        console.error('Error:', error);
        displayError(error.message);
    } finally {
        setLoadingState(false);
    }
}

function collectFormData() {
    const sponsorshipValue = Array.from(inputs.sponsorship).find(r => r.checked)?.value;

    // Get country value from Select2 if available
    let countryValue = inputs.country.value;
    if (typeof $ !== 'undefined') {
        countryValue = $('#country').val();
    }

    return {
        age: parseInt(inputs.age.value),
        country: countryValue,
        purpose: inputs.purpose.value,
        category: inputs.category.value,
        previous_rejections: parseInt(inputs.rejections.value),
        sponsorship: sponsorshipValue === 'yes' ? 1 : 0,
        document_completeness: parseInt(inputs.completeness.value)
    };
}

function setLoadingState(isLoading) {
    state.isLoading = isLoading;
    submitBtn.disabled = isLoading;

    if (isLoading) {
        submitBtn.classList.add('loading');
        loadingText.style.display = 'inline';
        btnText.style.display = 'none';
    } else {
        submitBtn.classList.remove('loading');
        loadingText.style.display = 'none';
        btnText.style.display = 'inline';
    }
}

function resetForm() {
    form.reset();

    // Reset Select2
    if (typeof $ !== 'undefined') {
        $('#country').val(null).trigger('change');
    }

    updateCompletenessDisplay();
    resultCard.classList.remove('show');
    errorCard.classList.remove('show');

    // Clear errors
    Object.values(errors).forEach(span => span.textContent = '');

    checkFormValidity();
}

// ===================================
// Result Display Logic
// ===================================

let trendChartInstance = null;
let confidenceChartInstance = null;

function displayResult(prediction, formData) {
    const roundedPrediction = Math.round(prediction);
    const resultValueObj = document.getElementById('resultValue');
    const resultRangeObj = document.getElementById('resultRange');
    const riskBadge = document.getElementById('riskBadge');

    // 1. Calculate Risk & Range
    const { riskLevel, factors } = analyzeRisk(formData, prediction);
    const range = calculateRange(prediction, riskLevel);

    // 2. Update UI Content
    riskBadge.className = `result-badge ${riskLevel.toLowerCase()}`;
    riskBadge.textContent = `${riskLevel} Risk`;

    resultRangeObj.textContent = `Estimated Range: ${range.min} - ${range.max} days`;

    updateInfluencingFactors(factors);

    // 3. Show Card & Animate
    resultCard.classList.add('show');
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

    animateValue(resultValueObj, 0, roundedPrediction, CONFIG.ANIMATION_DURATION);

    // 4. Update Visualizations
    updateCharts(roundedPrediction, range);
}

function analyzeRisk(data, prediction) {
    // Determine risk based on inputs
    // This replicates some backend logic for immediate UI feedback

    let score = 0;
    const factors = [];

    // Positive Factors
    if (data.document_completeness > 80) {
        score -= 2;
        factors.push({ text: "High document completeness", type: "positive" });
    }
    if (data.sponsorship === 1) {
        score -= 1;
        factors.push({ text: "Sponsorship provided", type: "positive" });
    }

    // Negative Factors
    if (data.previous_rejections > 0) {
        score += 3;
        factors.push({ text: `Prior rejection history (${data.previous_rejections})`, type: "negative" });
    }
    if (data.document_completeness < 50) {
        score += 2;
        factors.push({ text: "Incomplete documentation", type: "negative" });
    }
    if (data.age < 21) {
        score += 1; // Slight higher risk for very young applicants
    }

    // Determine Level
    let level = 'Medium';
    if (score <= -2) level = 'Low';
    if (score >= 3) level = 'High';

    // Add general factors if list is short
    if (factors.length < 2) {
        factors.push({ text: `Visa Category: ${data.category}`, type: "neutral" });
        factors.push({ text: `Target Country: ${data.country}`, type: "neutral" });
    }

    return { riskLevel: level, factors };
}

function calculateRange(prediction, riskLevel) {
    // Uncertainty varies by risk
    let variance = 0.10; // 10% default

    if (riskLevel === 'Low') variance = 0.05;
    if (riskLevel === 'High') variance = 0.20;

    return {
        min: Math.max(1, Math.round(prediction * (1 - variance))),
        max: Math.round(prediction * (1 + variance))
    };
}

function updateInfluencingFactors(factors) {
    const list = document.getElementById('influencingFactors');
    list.innerHTML = '';

    factors.forEach(factor => {
        const li = document.createElement('li');
        li.textContent = factor.text;

        // Optional: Style based on positive/negative
        if (factor.type === 'positive') li.style.color = 'var(--success-color)';
        if (factor.type === 'negative') li.style.color = 'var(--error-color)';

        list.appendChild(li);
    });
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function displayError(message) {
    errorMessage.textContent = message;
    errorCard.classList.add('show');
    errorCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
}


// ===================================
// Chart.js Visualizations
// ===================================

function updateCharts(prediction, range) {
    if (typeof Chart === 'undefined') return;

    // Generate next 6 months labels
    const monthNames = [];
    const today = new Date();
    for (let i = 0; i < 6; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
        monthNames.push(d.toLocaleString('default', { month: 'short' }));
    }

    updateTrendChart(prediction, monthNames);
    updateConfidenceChart(prediction, range);
    updatePeakTravelChart(prediction);
}

function updateTrendChart(prediction, labels) {
    const ctx = document.getElementById('trendChart').getContext('2d');

    // Generate mock projected data around the prediction
    const dataPoints = labels.map(() => {
        const variation = (Math.random() * 0.2) - 0.1; // +/- 10% random
        return Math.round(prediction * (1 + variation));
    });

    if (trendChartInstance) {
        trendChartInstance.destroy();
    }

    trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Projected Time',
                data: dataPoints,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#667eea',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.parsed.y} days`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    suggestedMin: Math.max(0, prediction - 15),
                    grid: { color: '#f1f5f9' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

function updateConfidenceChart(prediction, range) {
    const ctx = document.getElementById('confidenceChart').getContext('2d');

    const labels = [
        `${range.min}-${prediction}`,
        `${prediction} (Likely)`,
        `${prediction}-${range.max}`
    ];

    const dataPoints = [20, 60, 20];

    if (confidenceChartInstance) {
        confidenceChartInstance.destroy();
    }

    confidenceChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Probability',
                data: dataPoints,
                backgroundColor: [
                    'rgba(102, 126, 234, 0.4)',
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(102, 126, 234, 0.4)'
                ],
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { display: false },
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 11 } }
                }
            }
        }
    });
}

let peakTravelChartInstance = null;

function updatePeakTravelChart(prediction) {
    const ctx = document.getElementById('peakTravelChart').getContext('2d');

    // Mock data: High season vs Low season
    // Using simple month names for a full year overview or next 6 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Create seasonal pattern (Peak in Summer/Holiday seasons)
    const seasonalFactors = [0.9, 0.9, 1.0, 1.0, 1.2, 1.3, 1.3, 1.2, 1.0, 0.9, 1.1, 1.2];
    const dataPoints = seasonalFactors.map(factor => Math.round(prediction * factor));

    if (peakTravelChartInstance) {
        peakTravelChartInstance.destroy();
    }

    // Highlight the highest values
    const backgroundColors = dataPoints.map(val => {
        const maxVal = Math.max(...dataPoints);
        return val === maxVal ? '#f59e0b' : '#e2e8f0'; // Orange for peak, gray for others
    });

    peakTravelChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Avg. Processing Days',
                data: dataPoints,
                backgroundColor: backgroundColors,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => `Month: ${items[0].label}`,
                        label: (item) => `${item.parsed.y} days average`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { display: false },
                    display: false
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}
