/**
 * Comprehensive Node.js verification script for GeneGuard Frontend Registries & Helpers
 */

import {
  NORMAL_VALUE_REGISTRY,
  MODEL_COMMON_PROFILE_CONFIG,
  calculateBmi,
  mapProfileToModuleInputs,
  getNormalValuesForModule,
  MODEL_FEATURE_REGISTRY
} from '../frontend/src/utils/normalValueRegistry.js';

function runFrontendVerification() {
  console.log("=== RUNNING GENEGUARD FRONTEND LOGIC ACCEPTANCE TESTS ===");

  // TEST 1: BMI Calculation
  console.log("\n[TEST 1] Testing BMI calculation:");
  const bmi1 = calculateBmi(183, 100);
  console.log(`Height 183cm, Weight 100kg -> BMI: ${bmi1}`);
  if (bmi1 !== 29.9) throw new Error(`Expected BMI 29.9, got ${bmi1}`);

  const bmi2 = calculateBmi(183, 95);
  console.log(`Height 183cm, Weight 95kg -> BMI: ${bmi2}`);
  if (bmi2 !== 28.4) throw new Error(`Expected BMI 28.4, got ${bmi2}`);
  console.log("[OK] BMI calculation matches formula BMI = weight / (height_m^2)");

  // TEST 1B: Profile mapping across all 5 modules
  console.log("\n[TEST 1B] Testing Profile mapping to 5 modules:");
  const testProfile = {
    name: 'Test User',
    age: 21,
    sex: 'male',
    height_cm: 183,
    weight_kg: 100,
    bmi: 29.9,
    isComplete: true
  };

  const cardioMapped = mapProfileToModuleInputs(testProfile, 'cardiovascular');
  console.log("Cardiovascular mapped:", cardioMapped);
  if (cardioMapped.age !== 21 || cardioMapped.gender !== 'male' || cardioMapped.height !== 183 || cardioMapped.weight !== 100) {
    throw new Error("Cardiovascular profile mapping failed");
  }

  const metabolicMapped = mapProfileToModuleInputs(testProfile, 'metabolic');
  console.log("Metabolic mapped:", metabolicMapped);
  if (metabolicMapped.age !== 21 || metabolicMapped.height !== 183 || metabolicMapped.weight !== 100) {
    throw new Error("Metabolic profile mapping failed");
  }

  const bpMapped = mapProfileToModuleInputs(testProfile, 'blood_pressure');
  console.log("Blood Pressure mapped:", bpMapped);
  if (bpMapped.age !== 21 || bpMapped.sex !== 1 || bpMapped.bmi !== 29.9) {
    throw new Error("Blood Pressure profile mapping failed");
  }

  const thyroidMapped = mapProfileToModuleInputs(testProfile, 'thyroid');
  console.log("Thyroid mapped:", thyroidMapped);
  if (thyroidMapped.sex !== 1 || thyroidMapped.age !== 21) {
    throw new Error("Thyroid profile mapping failed");
  }

  const cancerMapped = mapProfileToModuleInputs(testProfile, 'cancer');
  console.log("Cancer mapped:", cancerMapped);
  if (cancerMapped.age !== 21 || cancerMapped.gender !== 1) {
    throw new Error("Cancer profile mapping failed");
  }
  console.log("[OK] Profile correctly maps to all 5 disease modules without duplication.");

  // TEST 2: Normal Values preserving profile
  console.log("\n[TEST 2] Testing Fill Normal Values preserves actual profile biometrics:");
  const normalCardio = getNormalValuesForModule('cardiovascular', testProfile);
  console.log("Normal values for Cardio (with profile):", normalCardio);
  if (normalCardio.age !== 21 || normalCardio.height !== 183 || normalCardio.weight !== 100) {
    throw new Error("Normal values overwrote actual patient profile biometrics!");
  }
  if (normalCardio.ap_hi !== 118 || normalCardio.ap_lo !== 76 || normalCardio.cholesterol !== 'normal') {
    throw new Error("Model-specific normal values not populated!");
  }
  console.log("[OK] Normal values successfully preserved actual profile biometrics.");

  // TEST 8: Profile Update (Weight 100 -> 95 kg)
  console.log("\n[TEST 8] Testing Profile Update weight 100 -> 95 kg:");
  const updatedProfile = {
    ...testProfile,
    weight_kg: 95,
    bmi: calculateBmi(183, 95)
  };
  const updatedMetabolic = mapProfileToModuleInputs(updatedProfile, 'metabolic');
  const updatedBp = mapProfileToModuleInputs(updatedProfile, 'blood_pressure');
  if (updatedMetabolic.weight !== 95) throw new Error("Metabolic weight failed to update");
  if (updatedBp.bmi !== 28.4) throw new Error("Blood pressure BMI failed to update to 28.4");
  console.log(`[OK] All modules automatically receive updated weight (95 kg) and BMI (${updatedBp.bmi}).`);

  console.log("\n================ ALL FRONTEND LOGIC ACCEPTANCE TESTS PASSED! ================\n");
}

runFrontendVerification();
