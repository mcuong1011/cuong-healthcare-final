import numpy as np
import tensorflow as tf
import os

# load model 1 lần khi import
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'robot', 'health_diagnosis_model.h5')
model = tf.keras.models.load_model(MODEL_PATH)

diseases = ["Flu", "Cold", "COVID-19", "Allergy"]
test_map = {
    "Flu": "Influenza A/B test",
    "Cold": "Nasal swab",
    "COVID-19": "PCR test",
    "Allergy": "Allergy skin test"
}
med_map = {
    "Flu": "Oseltamivir (Tamiflu)",
    "Cold": "Rest, fluids, antihistamines",
    "COVID-19": "Isolation + Paracetamol",
    "Allergy": "Loratadine or Cetirizine"
}

def predict(symptoms: list, n_iter: int = 50):
    """
    symptoms: list of 6 zeros/ones
    return: dict với mean, std, diagnosis, test, medicine
    """
    x = np.array([symptoms], dtype=np.float32)
    # Monte Carlo dropout nếu model có dropout layers:
    preds = np.array([model(x, training=True).numpy() for _ in range(n_iter)])
    mean = preds.mean(axis=0)[0].tolist()
    std  = preds.std(axis=0)[0].tolist()
    idx  = int(np.argmax(mean))
    diag = diseases[idx]
    return {
        "probabilities": dict(zip(diseases, mean)),
        "uncertainties": dict(zip(diseases, std)),
        "diagnosis": diag,
        "recommended_test": test_map[diag],
        "recommended_medicine": med_map[diag]
    }
