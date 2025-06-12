# NovaTrek Score Explanation

The NovaTrek Score is an intelligent ranking system that helps users find the best activities and restaurants based on multiple factors. The score ranges from 0-100+ points.

## Activity Score Formula

### 1. Expert Endorsement (50-100 points)
- **Base Expert Boost**: +50 points if expert-recommended
- **Expert Rating Bonus**: +0 to +50 points (expertRating × 10)
- This is the highest weighted factor because expert recommendations provide curated, high-quality suggestions

### 2. Popularity Score (0-30 points)
- **Google Rating**: 0-20 points (rating × 4)
  - Example: 4.5 stars = 18 points
- **Review Volume**: 0-10 points (min(10, userRatingsTotal / 100))
  - Capped at 10 points for places with 1000+ reviews

### 3. User Preference Match (0-25 points)
- **Activity Type Match**: +5 points per matching activity type
- **Interest Match**: +5 points per matching interest keyword
- Checks against user's saved preferences for activities and interests

### 4. Distance Score (0-10 points)
- Closer locations get higher scores
- Formula: max(0, 10 - (distance_in_km))
- No points if >10km away

### 5. Weather Suitability (+0-10 points)
- **Rainy weather + Indoor activity**: +10 points
- **Clear weather + Outdoor activity**: +5 points
- Helps suggest weather-appropriate activities

## Restaurant Score Formula

### 1. Expert Endorsement (60-100 points)
- **Base Expert Boost**: +60 points if expert-recommended
- **Expert Rating Bonus**: +0 to +40 points (expertRating × 8)
- Restaurants get higher base scores because dining is often preference-sensitive

### 2. Dietary Match (0-45 points)
- **Per Dietary Requirement**: +15 points per match
- Example: Vegan restaurant matching vegan preference = +15 points
- Can stack (vegan + gluten-free = +30 points)

### 3. Cuisine Match (0-30 points)
- **Per Cuisine Type**: +10 points per match
- Example: Italian restaurant when user searches for Italian = +10 points

### 4. Popularity Score (0-50 points)
- **Google Rating**: 0-40 points (rating × 8)
- **Review Volume**: 0-10 points (min(10, reviews / 50))

### 5. Price Level Match (+10 points)
- If restaurant price level matches user's specified price range

### 6. Distance Score (0-20 points)
- Formula: max(0, 20 - (distance_in_meters / 100))
- Restaurants get higher distance weighting since people travel less for food

## Example Calculations

### High-Scoring Activity Example
- Museum with expert recommendation (4.5/5 expert rating)
- Base expert: 50 + (4.5 × 10) = 95 points
- Google rating 4.7: 4.7 × 4 = 18.8 points
- Matches 2 user interests: 2 × 5 = 10 points
- 2km away: 10 - 2 = 8 points
- Indoor + rainy day: +10 points
- **Total: 141.8 points**

### High-Scoring Restaurant Example
- Expert-recommended Italian restaurant (5/5 expert rating)
- Base expert: 60 + (5 × 8) = 100 points
- Matches vegan dietary need: +15 points
- Italian cuisine match: +10 points
- Google rating 4.6: 4.6 × 8 = 36.8 points
- 500m away: 20 - (500/100) = 15 points
- **Total: 176.8 points**

## Why This Scoring System?

1. **Expert Recommendations First**: Prioritizes curated, high-quality options
2. **Personalization**: Heavily weights user preferences and dietary needs
3. **Practical Factors**: Considers distance and weather
4. **Balanced Popularity**: Uses ratings but doesn't solely rely on them
5. **Context-Aware**: Adjusts based on current conditions (weather, time, location)

The scoring system ensures users get recommendations that are not just popular, but actually suitable for their specific needs and circumstances.