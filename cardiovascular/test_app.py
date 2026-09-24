"""
GeneGuard Automated Integration and Endpoint Tests with Unit Conversion
"""

import unittest
from app import app


class GeneGuardTestCase(unittest.TestCase):

    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_home_route(self):
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Cardiovascular Risk Assessment', response.data)

    def test_valid_prediction_metric_units(self):
        payload = {
            'age': '50',
            'gender': 'male',
            'height': '170',
            'height_unit': 'cm',
            'weight': '80',
            'weight_unit': 'kg',
            'ap_hi': '130',
            'ap_lo': '85',
            'cholesterol': 'normal',
            'gluc': 'normal',
            'smoke': 'no',
            'alco': 'no',
            'active': 'yes'
        }
        response = self.app.post('/predict', data=payload)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Risk Analysis Result', response.data)
        self.assertIn(b'GENEGUARD CARDIOVASCULAR ASSESSMENT', response.data)

    def test_valid_prediction_feet_and_lbs_conversion(self):
        # Height: 5 ft 8 in (= 172.72 cm), Weight: 176 lbs (= 79.83 kg)
        payload = {
            'age': '52',
            'gender': 'male',
            'height_unit': 'ft',
            'height_ft': '5',
            'height_in': '8',
            'weight': '176',
            'weight_unit': 'lbs',
            'ap_hi': '140',
            'ap_lo': '90',
            'cholesterol': 'above_normal',
            'gluc': 'normal',
            'smoke': 'no',
            'alco': 'no',
            'active': 'yes'
        }
        response = self.app.post('/predict', json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['patient_data']['height_cm'], 172.7)
        self.assertEqual(data['patient_data']['weight_kg'], 79.8)
        self.assertIn('5 ft 8 in', data['patient_data']['height_ft_in'])

    def test_validation_error_missing_age(self):
        payload = {
            'gender': 'male',
            'height': '170',
            'weight': '80',
            'ap_hi': '130',
            'ap_lo': '85'
        }
        response = self.app.post('/predict', data=payload)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Please enter your age', response.data)

    def test_validation_error_bp_inverted(self):
        payload = {
            'age': '45',
            'gender': 'male',
            'height': '175',
            'weight': '75',
            'ap_hi': '80',  # Systolic < Diastolic invalid
            'ap_lo': '120'
        }
        response = self.app.post('/predict', data=payload)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Systolic blood pressure must be higher than Diastolic blood pressure', response.data)

    def test_report_generation(self):
        payload = {
            'age': '50',
            'gender': 'male',
            'height': '170',
            'weight': '80',
            'ap_hi': '130',
            'ap_lo': '85',
            'cholesterol': 'normal',
            'gluc': 'normal',
            'smoke': 'no',
            'alco': 'no',
            'active': 'yes'
        }
        response = self.app.post('/report', data=payload)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'CONFIDENTIAL HEALTH REPORT', response.data)
        self.assertIn(b'Body Mass Index (BMI)', response.data)


if __name__ == '__main__':
    unittest.main()
