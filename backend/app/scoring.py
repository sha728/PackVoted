# backend/app/scoring.py
import json
import os
import math
from typing import List, Dict, Any
from collections import Counter
from .models import Participant, Trip

# Load destinations from JSON file
def load_destinations():
    data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'india_destinations.json')
    with open(data_path, 'r') as f:
        return json.load(f)

DESTINATIONS = load_destinations()
ALL_VIBES = list(set().union(*[set(d['vibes']) for d in DESTINATIONS]))

def get_vibe_vector(vibes, all_vibes):
    """Convert vibes list to vector."""
    vector = [0] * len(all_vibes)
    for i, vibe in enumerate(all_vibes):
        if vibe in vibes:
            vector[i] = 1
    return vector

def cosine_similarity(vec1, vec2):
    """Calculate cosine similarity between two vectors."""
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    magnitude1 = math.sqrt(sum(a * a for a in vec1))
    magnitude2 = math.sqrt(sum(b * b for b in vec2))
    if magnitude1 == 0 or magnitude2 == 0:
        return 0
    return dot_product / (magnitude1 * magnitude2)

class DestinationScorer:
    def __init__(self):
        self.destinations = DESTINATIONS
    
    def score_destinations(self, participants: List[Participant], trip: Trip) -> List[Dict]:
        """Score all destinations with fairness checks."""
        hard_constraints = self._get_hard_constraints(participants, trip)
        soft_preferences = self._get_soft_preferences(participants)
        
        scored = []
        for dest in self.destinations:
            # Layer 1: Hard constraints
            basic_result = self._score_single(dest, hard_constraints, soft_preferences)
            if basic_result['violations'] > 0:
                continue
            
            # Layer 2: Accessibility check
            if not self._check_accessibility(dest, hard_constraints['accessibility_needs']):
                basic_result['violations'] += 1
                basic_result['violation_details'].append("Does not meet accessibility needs")
                continue
            
            # Layer 3: Fairness analysis
            fairness = self._calculate_fairness_scores(dest, participants)
            
            # Least misery rule: minimum score must be acceptable
            if fairness['min_score'] < 0.3:
                basic_result['violations'] += 0.5
                basic_result['violation_details'].append(f"Lowest member satisfaction: {fairness['min_score']:.0%}")
            
            # High conflict detection
            if fairness['variance'] > 0.3:
                basic_result['conflict_warning'] = "High disagreement in group - consider alternatives"
            
            # Adjusted score: 70% average + 30% minimum
            adjusted_score = (basic_result['total_score'] * 0.7) + (fairness['min_score'] * 0.3)
            
            scored.append({
                'destination': dest,
                'total_score': round(adjusted_score, 3),
                'basic_score': basic_result['total_score'],
                'fairness': fairness,
                'breakdown': basic_result['breakdown'],
                'violations': basic_result['violations'],
                'violation_details': basic_result['violation_details'],
                'conflict_warning': basic_result.get('conflict_warning')
            })
        
        scored.sort(key=lambda x: x['total_score'], reverse=True)
        return self._enforce_diversity(scored[:10], top_n=5)
    
    def _get_hard_constraints(self, participants: List[Participant], trip: Trip) -> Dict:
        return {
            'budget_max': min((p.budget_ceiling or float('inf')) for p in participants),
            'budget_min': max((p.budget_floor or 0) for p in participants),
            'avoided_destinations': list(set().union(*[set(p.avoided_destinations or []) for p in participants])),
            'accessibility_needs': list(set().union(*[set(p.accessibility_needs or []) for p in participants])),
            'trip_duration': trip.duration_days
        }
    
    def _get_soft_preferences(self, participants: List[Participant]) -> Dict:
        n = len(participants)
        return {
            'activity_level': sum(p.activity_level or 0.5 for p in participants) / n,
            'culture_nature': sum(p.culture_nature_balance or 0.5 for p in participants) / n,
            'climate': self._vote_climate(participants),
            'required_vibes': list(set().union(*[set(p.required_vibes or []) for p in participants])),
            'weights': self._average_weights(participants)
        }
    
    def _vote_climate(self, participants: List[Participant]) -> str:
        climates = [p.climate_preference for p in participants if p.climate_preference]
        if not climates:
            return "mild"
        return max(set(climates), key=climates.count)
    
    def _average_weights(self, participants: List[Participant]) -> Dict:
        n = len(participants)
        weights = {"budget": 0, "weather": 0, "activities": 0, "vibe": 0}
        for p in participants:
            w = p.weights or {"budget": 0.25, "weather": 0.25, "activities": 0.25, "vibe": 0.25}
            for key in weights:
                weights[key] += w.get(key, 0.25) / n
        return weights
    
    def _score_single(self, dest: Dict, hard: Dict, soft: Dict) -> Dict:
        scores = {}
        violations = 0
        violation_details = []
        
        # 1. Budget compatibility
        if dest['daily_cost'] > hard['budget_max']:
            violations += 1
            violation_details.append(f"Cost ₹{dest['daily_cost']} exceeds budget ₹{hard['budget_max']}")
            scores['budget'] = 0
        else:
            range_size = hard['budget_max'] - hard['budget_min']
            if range_size > 0:
                position = (hard['budget_max'] - dest['daily_cost']) / range_size
                scores['budget'] = 0.5 + (position * 0.5)
            else:
                scores['budget'] = 1.0
        
        # 2. Climate match
        scores['climate'] = self._match_climate(dest['climate'], soft['climate'])
        
        # 3. Vibe match using cosine similarity
        dest_vibe_vec = get_vibe_vector(dest['vibes'], ALL_VIBES)
        user_vibe_vec = get_vibe_vector(soft['required_vibes'], ALL_VIBES)
        if sum(user_vibe_vec) == 0:
            scores['vibe'] = 1.0
        else:
            scores['vibe'] = cosine_similarity(dest_vibe_vec, user_vibe_vec)
        
        # 4. Activity alignment (FIXED - now properly assigned)
        dest_activity = self._estimate_activity_level(dest['activities'])
        scores['activity'] = 1 - abs(dest_activity - soft['activity_level'])
        
        # 5. Duration fit
        if hard['trip_duration'] < dest['duration'] - 1:
            violations += 0.5
            violation_details.append(f"Needs {dest['duration']} days, you have {hard['trip_duration']}")
            scores['duration'] = 0.5
        else:
            scores['duration'] = 1.0
        
        # 6. Check avoided destinations
        if dest['name'] in hard['avoided_destinations'] or dest['state'] in hard['avoided_destinations']:
            violations += 10
            violation_details.append("Explicitly avoided")
        
        # Weighted total
        weights = soft['weights']
        total = (
            scores.get('budget', 0) * weights.get('budget', 0.25) +
            scores.get('climate', 0) * weights.get('weather', 0.25) +
            scores.get('vibe', 0) * weights.get('vibe', 0.25) +
            scores.get('activity', 0) * weights.get('activities', 0.25)
        )
        
        return {
            'destination': dest,
            'total_score': round(total, 3),
            'breakdown': {k: round(v, 2) for k, v in scores.items()},
            'violations': violations,
            'violation_details': violation_details
        }
    
    def _match_climate(self, dest_climate: str, preferred: str) -> float:
        climate_order = ['snow', 'cold', 'mild', 'warm', 'hot']
        if dest_climate == preferred:
            return 1.0
        try:
            dest_idx = climate_order.index(dest_climate)
            pref_idx = climate_order.index(preferred)
            diff = abs(dest_idx - pref_idx)
            return max(0, 1 - (diff * 0.3))
        except ValueError:
            return 0.5
    
    def _estimate_activity_level(self, activities: List[str]) -> float:
        active_keywords = ['trekking', 'skiing', 'rafting', 'sports', 'hiking', 'bouldering', 'safari']
        relaxed_keywords = ['relaxation', 'beach relaxation', 'houseboat', 'ayurveda', 'yoga']
        
        active_count = sum(1 for a in activities if any(k in a.lower() for k in active_keywords))
        relaxed_count = sum(1 for a in activities if any(k in a.lower() for k in relaxed_keywords))
        
        total = len(activities) or 1
        return active_count / total if active_count > relaxed_count else 0.3 + (relaxed_count / total * 0.3)
    
    def _calculate_fairness_scores(self, dest: Dict, participants: List[Participant]) -> Dict:
        individual_scores = []
        
        for p in participants:
            user_vibes = p.required_vibes or []
            user_vec = get_vibe_vector(user_vibes, ALL_VIBES)
            dest_vec = get_vibe_vector(dest['vibes'], ALL_VIBES)
            if sum(user_vec) == 0:
                vibe_sim = 1.0
            else:
                vibe_sim = cosine_similarity(user_vec, dest_vec)
            
            climate_sim = self._match_climate(dest['climate'], p.climate_preference or 'mild')
            
            if p.budget_ceiling and dest['daily_cost'] <= p.budget_ceiling:
                budget_fit = 1.0
            else:
                budget_fit = 0.0
            
            individual = (vibe_sim * 0.4) + (climate_sim * 0.3) + (budget_fit * 0.3)
            individual_scores.append({
                'participant': p.email,
                'score': individual,
                'vibe_sim': vibe_sim,
                'climate_sim': climate_sim
            })
        
        scores_list = [s['score'] for s in individual_scores]
        mean = sum(scores_list) / len(scores_list)
        variance = sum((x - mean) ** 2 for x in scores_list) / len(scores_list)
        
        return {
            'individual_scores': individual_scores,
            'min_score': min(scores_list),
            'max_score': max(scores_list),
            'avg_score': mean,
            'variance': variance
        }
    
    def _check_accessibility(self, dest: Dict, needs: List[str]) -> bool:
        if not needs:
            return True
        accessible_vibes = ['family', 'relaxation', 'heritage', 'city']
        return any(v in dest['vibes'] for v in accessible_vibes)
    
    def _enforce_diversity(self, candidates: List[Dict], top_n: int) -> List[Dict]:
        if len(candidates) <= top_n:
            return candidates
        
        selected = []
        used_categories = set()
        
        for item in candidates:
            if len(selected) >= top_n:
                break
            
            dest = item['destination']
            if 'beach' in dest['vibes']:
                category = 'beach'
            elif 'mountains' in dest['vibes']:
                category = 'mountains'
            elif 'heritage' in dest['vibes'] or 'palace' in dest['vibes']:
                category = 'heritage'
            elif 'wildlife' in dest['vibes']:
                category = 'wildlife'
            else:
                category = 'other'
            
            if category not in used_categories or len(selected) >= top_n - 1:
                item['category'] = category
                selected.append(item)
                used_categories.add(category)
        
        if len(selected) < top_n:
            remaining = [c for c in candidates if c not in selected]
            selected.extend(remaining[:top_n - len(selected)])
        
        return selected[:top_n]

def generate_explanation(score_result: Dict, participants: List[Participant]) -> Dict:
    dest = score_result['destination']
    breakdown = score_result['breakdown']
    fairness = score_result.get('fairness', {})
    
    parts = []
    if breakdown.get('budget', 0) > 0.8:
        parts.append(f"fits your budget at ₹{dest['daily_cost']} per day")
    elif breakdown.get('budget', 0) > 0.5:
        parts.append(f"is within budget at ₹{dest['daily_cost']} per day")
    
    if breakdown.get('climate', 0) > 0.8:
        parts.append(f"has ideal {dest['climate']} weather")
    
    if breakdown.get('vibe', 0) > 0.7:
        matching = set(dest['vibes']) & set().union(*[set(p.required_vibes or []) for p in participants])
        if matching:
            parts.append(f"matches your vibe ({', '.join(list(matching)[:2])})")
    
    fairness_text = ""
    if fairness:
        min_score = fairness.get('min_score', 0)
        if min_score > 0.7:
            fairness_text = " Everyone in your group will love this!"
        elif min_score > 0.5:
            fairness_text = " Most of your group will enjoy this."
        else:
            fairness_text = " Some members may prefer alternatives."
    
    if parts:
        explanation = f"{dest['name']} " + ", and ".join(parts) + "." + fairness_text
    else:
        explanation = f"{dest['name']} is a balanced choice for your group." + fairness_text
    
    warning = score_result.get('conflict_warning', '')
    
    individual_breakdown = []
    if fairness.get('individual_scores'):
        for s in fairness['individual_scores']:
            individual_breakdown.append(f"- {s['participant']}: {s['score']:.0%} match")
    
    return {
        'summary': explanation,
        'warning': warning,
        'metrics': [f"{k}: {v:.0%}" for k, v in breakdown.items()],
        'group_satisfaction': {
            'average': f"{fairness.get('avg_score', 0):.0%}",
            'lowest': f"{fairness.get('min_score', 0):.0%}",
            'variance': "High" if fairness.get('variance', 0) > 0.3 else "Low"
        },
        'individual_matches': individual_breakdown,
        'activities': dest['activities'][:5],
        'best_time': dest['best_time'],
        'daily_cost': dest['daily_cost']
    }