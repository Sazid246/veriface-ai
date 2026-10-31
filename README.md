# VeriFace AI — Real vs Fake Image Detection

VeriFace AI is a full-stack web application designed to classify uploaded images as **REAL** or **FAKE** using machine learning. It provides a web interface for image analysis, prediction scores, processing-time information, prediction history, and model details.

> **Note:** Predictions are model-based estimates and should not be treated as definitive proof that an image is authentic or manipulated.

## Features

- **Image Classification:** Classifies uploaded images as REAL or FAKE.
- **Prediction Scores:** Displays the model's scores for both classes.
- **Fast Processing:** Reports the time taken to process an image.
- **Prediction History:** Provides access to previous predictions.
- **Model Information:** Displays details about the underlying model.
- **REST API:** Exposes endpoints through a FastAPI backend.
- **Interactive Frontend:** Provides a React-based user interface.

## Technology Stack

### Frontend
- React.js
- TypeScript
- Vite
- Tailwind CSS

### Backend
- Python
- FastAPI
- Uvicorn
- OpenCV
- NumPy
- Scikit-learn
- Joblib

### Machine Learning
- Histogram of Oriented Gradients (HOG)
- HSV color features
- Support Vector Machine (SVM)

## Project Structure

```text
real-fake-detector/
├── backend/
│   ├── app/
│   │   └── main.py
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── notebooks/
│   └── real_fake.ipynb
├── .gitignore
└── README.md
```

*Note: The structure above is illustrative. Your actual files and folders may differ.*

## Getting Started

### Prerequisites

Install the following software before running the project:

- Python 3.12
- Node.js and npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Sazid246/veriface-ai.git
cd veriface-ai
```

Replace the repository URL if your GitHub repository uses a different owner or name.

### 2. Set Up the Backend

Open a terminal and navigate to the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python3.12 -m venv .venv
```

Activate it on macOS or Linux:

```bash
source .venv/bin/activate
```

Install the dependencies:

```bash
python -m pip install --upgrade pip
```

If the project contains a `requirements.txt` file, install its dependencies:

```bash
python -m pip install -r requirements.txt
```

Otherwise, install the required packages:

```bash
python -m pip install fastapi uvicorn python-multipart numpy opencv-contrib-python scikit-learn joblib pillow
```

**Important:** Ensure the trained model files and any other required assets are present before starting the application.

### 3. Start the Backend Server

From the `backend` directory, run:

```bash
python -m uvicorn app.main:app --reload
```

The backend API should be available at:

- API base URL: `http://127.0.0.1:8000`
- Interactive API documentation: `http://127.0.0.1:8000/docs`

Keep this terminal running.

### 4. Configure the Frontend

Open a **second terminal** and navigate to the frontend directory:

```bash
cd "/Users/sazidahmed/Desktop/Data Analytics Major Project/real-fake-detector/frontend"
```

Install the frontend dependencies:

```bash
npm install
```

Create a `.env` file inside the `frontend` directory containing:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Ensure the frontend API service reads this environment variable. If the project uses a different variable name, retain the name expected by the existing code.

### 5. Run the Frontend

From the `frontend` directory, execute:

```bash
npm run dev
```

Open the local URL printed in the terminal, commonly:

`http://localhost:5173`

You can now use the web application to upload images and view predictions.

## API Endpoints

The backend provides the following endpoints:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Checks backend health. |
| GET | `/api/model-info` | Retrieves information about the model. |
| POST | `/api/predict` | Submits an image for classification. |
| GET | `/api/history` | Retrieves prediction history. |
| DELETE | `/api/history` | Clears prediction history. |

For request parameters and response formats, start the backend and visit:

`http://127.0.0.1:8000/docs`

## Machine Learning Workflow

The application uses a machine-learning pipeline based on HOG and HSV features with an SVM classifier.

The general workflow is:

1. Upload an image through the frontend.
2. Send the image to the FastAPI backend.
3. Extract the features required by the trained model.
4. Apply the trained SVM classifier.
5. Return the predicted class and model scores.
6. Display the result and relevant processing information in the frontend.

The actual preprocessing steps and feature configuration depend on the implementation and training pipeline used by the project.

## Example Prediction Response

A successful prediction may return a response similar to:

```json
{
  "prediction_id": "example_prediction_id",
  "predicted_label": "REAL",
  "scores": {
    "REAL": 0.9611,
    "FAKE": 0.0389
  },
  "score_type": "model_score",
  "model_name": "HOG + HSV / SVM",
  "processing_time_ms": 13,
  "timestamp": "2026-10-31T22:01:06.827598+00:00"
}
```

*This is an illustrative example, not a guaranteed result. Model scores are not necessarily calibrated probabilities.*

## Limitations

- Classification performance depends on the training data, feature extraction process, and model quality.
- Unseen image types or image manipulation techniques may affect predictions.
- A high model score does not guarantee that an image is genuine or manipulated.
- The model should be evaluated on an independent test dataset before being used in real-world applications.

## Future Improvements

Potential improvements include:

- Training and evaluating on more diverse datasets.
- Comparing traditional machine-learning methods with deep-learning models.
- Improving robustness against image transformations.
- Adding explainability and visual analysis features.
- Improving prediction-history management.
- Evaluating precision, recall, F1-score, and confusion matrices.

## Security and Privacy

- Do not commit API keys, passwords, credentials, or private configuration files.
- Keep environment files such as `.env` out of version control.
- Review uploaded-image storage and prediction-history handling before deploying the application publicly.
- Configure appropriate file-size limits and input validation for production use.

## License

No license has been specified yet. Add a `LICENSE` file if you intend to distribute the project under an open-source license.

## Author

**Sazid Ahmed**

GitHub: [Sazid246](https://github.com/Sazid246)