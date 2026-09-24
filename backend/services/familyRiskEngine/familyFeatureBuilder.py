"""
GeneGuard Family Feature Builder
--------------------------------
Transforms family pedigree members and their 3-state condition status into
structured, disease-specific family feature vectors.

CRITICAL RULES:
- YES = 1
- NO = 0
- UNKNOWN = null (None in Python)
- Never convert UNKNOWN (null) into NO (0).
- Unknown is not the same as confirmed absence of disease.
- Derived counts count strictly CONFIRMED affected members (value == 1).
"""

from typing import List, Dict, Any, Optional
from .familyRiskConfig import DISEASES


def normalize_relationship_key(relationship: str, person_id: str = "") -> str:
    """
    Normalizes human relationship titles into standard feature prefix tokens:
    e.g. "Father" -> "father", "Paternal Grandfather" -> "paternal_grandfather", etc.
    """
    rel = (relationship or "").strip().lower()
    pid = (person_id or "").strip().lower()

    if "paternal" in rel or "paternal" in pid:
        if "grandfather" in rel or "grandfather" in pid:
            return "paternal_grandfather"
        if "grandmother" in rel or "grandmother" in pid:
            return "paternal_grandmother"
    if "maternal" in rel or "maternal" in pid:
        if "grandfather" in rel or "grandfather" in pid:
            return "maternal_grandfather"
        if "grandmother" in rel or "grandmother" in pid:
            return "maternal_grandmother"

    if "father" in rel or pid == "father":
        return "father"
    if "mother" in rel or pid == "mother":
        return "mother"
    if "brother" in rel or pid.startswith("brother"):
        return "brother"
    if "sister" in rel or pid.startswith("sister"):
        return "sister"
    if "grandfather" in rel:
        return "grandfather"
    if "grandmother" in rel:
        return "grandmother"
    if "son" in rel:
        return "son"
    if "daughter" in rel:
        return "daughter"
    if "uncle" in rel:
        return "uncle"
    if "aunt" in rel:
        return "aunt"

    return rel.replace(" ", "_") if rel else "relative"


def is_first_degree(rel_key: str) -> bool:
    """1st-degree biological relatives: 50% shared genetics (Father, Mother, Brother, Sister, Son, Daughter)."""
    return rel_key in ["father", "mother", "brother", "sister", "son", "daughter"]


def is_second_degree(rel_key: str) -> bool:
    """2nd-degree biological relatives: 25% shared genetics (Grandparents, Aunts, Uncles, Nephews/Nieces)."""
    return any(k in rel_key for k in ["grandfather", "grandmother", "uncle", "aunt"])


def extract_member_disease_state(member: Dict[str, Any], disease: str) -> Optional[int]:
    """
    Extracts the 3-state value (1, 0, or None) for a given disease from a member record.
    Supports structured `family_conditions` object:
        YES = 1
        NO = 0
        UNKNOWN = None (null)
    Provides fallback parsing for legacy condition lists.
    """
    fam_conditions = member.get("family_conditions")
    if isinstance(fam_conditions, dict) and disease in fam_conditions:
        raw_val = fam_conditions[disease]
        if raw_val is None or raw_val == "unknown" or raw_val == "null":
            return None
        if raw_val in [1, "1", True, "yes", "YES"]:
            return 1
        if raw_val in [0, "0", False, "no", "NO"]:
            return 0
        return None

    # Check if member is marked overall as health history unknown
    if member.get("history_unknown"):
        return None

    # Fallback to legacy string conditions list if family_conditions is not explicitly set
    legacy_conditions = [str(c).lower() for c in member.get("conditions", [])]
    summary = str(member.get("health_summary", "")).lower()
    text = " ".join(legacy_conditions) + " " + summary

    keyword_map = {
        "diabetes": ["diabetes", "t2d", "type 2", "metabolic"],
        "hypertension": ["hypertension", "high blood pressure", "htn", "bp"],
        "cardiovascular": ["cardiovascular", "heart attack", "heart disease", "cad", "stroke"],
        "thyroid": ["thyroid", "hypothyroid", "hyperthyroid", "hashimoto", "goitre"],
        "cancer": ["cancer", "tumor", "carcinoma", "malignancy", "oncology"]
    }

    keywords = keyword_map.get(disease, [disease])
    if any(k in text for k in keywords):
        return 1

    # If no conditions recorded and not marked unknown, default is None unless confirmed
    return None


class FamilyFeatureBuilder:
    """
    Builds disease-specific family feature vectors from structured family tree records.
    """

    @classmethod
    def build_all_disease_features(cls, family_members: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        """
        Builds feature dictionaries for all 5 GeneGuard diseases.
        """
        features_by_disease = {}
        for disease in DISEASES:
            features_by_disease[disease] = cls.build_disease_features(disease, family_members)
        return features_by_disease

    @classmethod
    def build_disease_features(cls, disease: str, family_members: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Constructs a structured feature dictionary for a single disease.
        Includes direct relative keys (e.g. father_diabetes: 1|0|null)
        and validated derived kinship counts.
        """
        if not family_members:
            return {}

        features: Dict[str, Any] = {}

        # Standard direct relatives
        features[f"father_{disease}"] = None
        features[f"mother_{disease}"] = None
        features[f"sibling_{disease}"] = None
        features[f"paternal_grandfather_{disease}"] = None
        features[f"paternal_grandmother_{disease}"] = None
        features[f"maternal_grandfather_{disease}"] = None
        features[f"maternal_grandmother_{disease}"] = None

        first_degree_affected = 0
        second_degree_affected = 0
        affected_parents = 0
        affected_siblings = 0
        affected_grandparents = 0

        first_degree_unknown = 0
        second_degree_unknown = 0

        for member in family_members:
            rel = member.get("relationship", "")
            pid = member.get("person_id", "")
            rel_key = normalize_relationship_key(rel, pid)

            if rel_key in ["self", "me"]:
                continue

            status = extract_member_disease_state(member, disease)

            # Assign specific feature slot if mapped
            if rel_key == "father":
                features[f"father_{disease}"] = status
            elif rel_key == "mother":
                features[f"mother_{disease}"] = status
            elif rel_key in ["brother", "sister"]:
                features[f"{rel_key}_{disease}"] = status
                # sibling rollup
                if status == 1:
                    features[f"sibling_{disease}"] = 1
                elif features.get(f"sibling_{disease}") != 1:
                    features[f"sibling_{disease}"] = status
            elif rel_key == "paternal_grandfather":
                features[f"paternal_grandfather_{disease}"] = status
            elif rel_key == "paternal_grandmother":
                features[f"paternal_grandmother_{disease}"] = status
            elif rel_key == "maternal_grandfather":
                features[f"maternal_grandfather_{disease}"] = status
            elif rel_key == "maternal_grandmother":
                features[f"maternal_grandmother_{disease}"] = status

            # Calculate derived counts
            if is_first_degree(rel_key):
                if status == 1:
                    first_degree_affected += 1
                    if rel_key in ["father", "mother"]:
                        affected_parents += 1
                    if rel_key in ["brother", "sister"]:
                        affected_siblings += 1
                elif status is None:
                    first_degree_unknown += 1

            elif is_second_degree(rel_key):
                if status == 1:
                    second_degree_affected += 1
                    if "grand" in rel_key:
                        affected_grandparents += 1
                elif status is None:
                    second_degree_unknown += 1

        # Derived family-history features
        features["first_degree_affected_count"] = first_degree_affected
        features["second_degree_affected_count"] = second_degree_affected
        features["affected_parent_count"] = affected_parents
        features["affected_sibling_count"] = affected_siblings
        features["affected_grandparent_count"] = affected_grandparents
        features["first_degree_unknown_count"] = first_degree_unknown
        features["second_degree_unknown_count"] = second_degree_unknown

        return features
