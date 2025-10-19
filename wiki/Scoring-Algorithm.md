# 🏆 Scoring Algorithm - Friend Ranking System

> **Complete guide to understanding and customizing The Load Down's sophisticated friend ranking algorithm**

---

## 🧠 Algorithm Overview

The **Friend Scoring Algorithm** is the intelligence behind The Load Down's rankings - a sophisticated system that analyzes your interaction patterns to determine which connections bring the most value to your life.

Think of it as your personal relationship advisor that learns from your experiences and helps you understand the true depth and quality of your social connections! ✨

---

## 📊 The Four Pillars of Connection

### 1. 🔄 **Frequency (Default: 35%)**
*How often you interact with this person*

#### What It Measures
- **Total Encounter Count**: Raw number of interactions
- **Interaction Rate**: Encounters per time period
- **Consistency**: Regular vs sporadic contact patterns
- **Recent Activity**: Higher weight for current activity levels

#### Calculation Details
```
Frequency Score = (Total Encounters × Recency Factor) / Time Period
Base Score: 0-100 based on your most active connection
Recency Factor: 1.0 for recent, 0.5 for older patterns
Time Period: Days since first encounter with this person
```

#### Why It Matters
- **Relationship Investment**: Shows where you put your social energy
- **Habit Formation**: Identifies your natural patterns
- **Commitment Level**: Frequent contact indicates relationship priority
- **Mutual Interest**: High frequency suggests both parties are engaged

#### Frequency Tiers
- **💎 Diamond (90-100)**: Daily or near-daily contact
- **🥇 Gold (70-89)**: Multiple times per week
- **🥈 Silver (50-69)**: Weekly interactions
- **🥉 Bronze (30-49)**: Bi-weekly to monthly
- **📱 Casual (0-29)**: Monthly or less frequent

### 2. ⏰ **Recency (Default: 25%)**
*How recently you last connected*

#### What It Measures
- **Days Since Last Contact**: Raw time since last encounter
- **Recency Curve**: Exponential decay over time
- **Contact Rhythm**: Expected vs actual contact timing
- **Relationship Momentum**: Active vs dormant connections

#### Calculation Details
```
Recency Score = 100 × e^(-days_since_last_contact / decay_rate)
Decay Rate: 30 days (adjustable in settings)
Maximum Score: 100 for same-day contact
Half-Life: 21 days (score halves every 3 weeks)
```

#### Why It Matters
- **Current Relevance**: Recent connections are more meaningful
- **Active Relationships**: Distinguishes current vs past friendships
- **Momentum Tracking**: Shows which relationships are growing
- **Attention Distribution**: Helps balance current social focus

#### Recency Levels
- **🔥 Hot (90-100)**: Last contact within 3 days
- **⚡ Active (70-89)**: Last contact within 1-2 weeks
- **🌡️ Warm (50-69)**: Last contact within 1 month
- **❄️ Cool (30-49)**: Last contact 1-3 months ago
- **🧊 Cold (0-29)**: Last contact over 3 months ago

### 3. ⭐ **Quality (Default: 30%)**
*Average rating of your encounters*

#### What It Measures
- **Average Star Rating**: Mean rating across all encounters
- **Rating Consistency**: Variance in experience quality
- **Quality Trends**: Improving vs declining experiences
- **Peak Experiences**: Exceptional encounters weighted higher

#### Calculation Details
```
Quality Score = (Average Rating / 5) × 100
Rating Weight: Recent encounters weighted 2x higher
Trend Bonus: +10 points for improving trends
Consistency Bonus: +5 points for low variance
Peak Bonus: +5 points for any 5-star encounters
```

#### Why It Matters
- **Satisfaction Tracking**: Measures actual enjoyment level
- **Relationship Health**: Shows if connections bring happiness
- **Compatibility Assessment**: Identifies best matches
- **Experience Optimization**: Helps focus on quality relationships

#### Quality Tiers
- **🌟 Exceptional (90-100)**: Consistently amazing experiences
- **😊 Great (70-89)**: Generally positive encounters
- **👍 Good (50-69)**: Decent, satisfactory interactions
- **😐 Mediocre (30-49)**: Mixed or below-average experiences
- **😞 Poor (0-29)**: Consistently disappointing encounters

### 4. ⚖️ **Mutuality (Default: 10%)**
*Balance of who initiates contact*

#### What It Measures
- **Initiation Balance**: Who typically reaches out first
- **Reciprocity**: Mutual vs one-sided relationship effort
- **Relationship Equity**: Fair vs imbalanced social investment
- **Organic Interest**: Natural vs forced connections

#### Calculation Details
```
Mutuality Score = 100 - |50 - (Your_Initiation_% × 100)|
Perfect Balance (50/50): Score = 100
One-Sided (100/0 or 0/100): Score = 50
Moderate Imbalance (70/30): Score = 80
```

#### Why It Matters
- **Relationship Health**: Balanced relationships are more sustainable
- **Effort Assessment**: Shows where you might be over-investing
- **Natural Chemistry**: Mutual initiation indicates genuine interest
- **Social Dynamics**: Helps identify relationship power dynamics

#### Mutuality Levels
- **⚖️ Perfect Balance (90-100)**: Equal initiation from both sides
- **🤝 Mostly Balanced (70-89)**: Slight preference but mutual
- **📱 Imbalanced (50-69)**: Clear initiator pattern
- **🔄 One-Sided (30-49)**: Heavily skewed initiation
- **❌ Completely One-Sided (0-29)**: Only one person initiates

---

## 🎛️ Customizing Your Algorithm

### Accessing Algorithm Settings

#### Navigation Path
1. **Settings** → **Friend Scoring Algorithm**
2. **Dashboard** → Tap any friend score → **"Customize Algorithm"**
3. **Analytics** → **"Algorithm Settings"**

#### Weight Adjustment Interface
```
🔄 Frequency:   [████████░░] 35%
⏰ Recency:     [█████░░░░░] 25%  
⭐ Quality:     [██████░░░░] 30%
⚖️ Mutuality:   [█░░░░░░░░░] 10%
                          ───
                         100%
```

### Customization Scenarios

#### **The Quality Seeker** 🌟
```
Frequency: 20%  (Less important)
Recency: 15%    (Less important) 
Quality: 55%    (Most important)
Mutuality: 10%  (Standard)
```
*Perfect for those who prefer fewer, higher-quality connections*

#### **The Social Butterfly** 🦋
```
Frequency: 50%  (Most important)
Recency: 30%    (Very important)
Quality: 10%    (Less important)
Mutuality: 10%  (Standard)
```
*Ideal for highly social people who value staying in touch*

#### **The Balanced Connector** ⚖️
```
Frequency: 25%  (Important)
Recency: 25%    (Important)
Quality: 25%    (Important)
Mutuality: 25%  (Important)
```
*For those who want all factors equally weighted*

#### **The Relationship Analyst** 📊
```
Frequency: 30%  (Important)
Recency: 20%    (Moderate)
Quality: 20%    (Moderate)
Mutuality: 30%  (Most important)
```
*Focus on relationship dynamics and mutual investment*

### Dynamic Weight Adjustment

#### **Seasonal Adjustments**
- **High Social Periods**: Increase Frequency and Recency weights
- **Quality Focus Periods**: Increase Quality weight for selective socializing
- **Relationship Review**: Temporarily increase Mutuality to assess balance
- **Fresh Start**: Reset to default weights for objective view

#### **Life Stage Adaptations**
- **Dating Phase**: Higher Quality and Mutuality weights
- **Established Relationships**: Higher Frequency and Recency
- **Social Expansion**: Balanced weights to discover new patterns
- **Quality Curation**: Higher Quality weight to focus on best connections

---

## 📈 Understanding Your Scores

### Score Interpretation Guide

#### **90-100: Legendary Connections** 🏆
- **Characteristics**: Frequent, recent, high-quality, balanced relationships
- **Examples**: Best friends, romantic partners, closest companions
- **Recommendation**: These are your core circle - invest time to maintain them
- **Typical Count**: 3-8 people in most social circles

#### **80-89: Excellent Relationships** 🥇
- **Characteristics**: Strong in 3+ areas, consistent positive interactions
- **Examples**: Close friends, regular favorites, trusted companions
- **Recommendation**: Great relationships worth prioritizing and growing
- **Typical Count**: 8-15 people with active social lives

#### **70-79: Solid Connections** 🥈
- **Characteristics**: Good in most areas, reliable and enjoyable
- **Examples**: Regular friends, consistent connections, positive acquaintances
- **Recommendation**: Maintain current level, consider deepening
- **Typical Count**: 15-25 people in broader social circle

#### **60-69: Developing Relationships** 🥉
- **Characteristics**: Potential for growth, some strong qualities
- **Examples**: New friends, occasional connections, evolving relationships
- **Recommendation**: Opportunity for investment if desired
- **Typical Count**: Variable based on social expansion phase

#### **50-59: Casual Connections** 📱
- **Characteristics**: Infrequent or inconsistent, limited depth
- **Examples**: Acquaintances, rare meetups, situational connections
- **Recommendation**: Maintain at current level or consider deeper investment
- **Typical Count**: Highly variable, often 20-50+ people

#### **Below 50: Distant or Problematic** ⚠️
- **Characteristics**: Very infrequent, low quality, or imbalanced
- **Examples**: Old contacts, disappointing connections, one-sided relationships
- **Recommendation**: Consider whether to invest more or let naturally fade
- **Typical Count**: Often includes historical connections no longer active

### Score Dynamics

#### **Improving Scores** 📈
```
Previous Score: 67
Current Score: 74 (+7)
Trend: ↗️ Improving over last 30 days
```
- **Recent Quality Encounters**: High-rated recent meetings
- **Increased Frequency**: More regular contact pattern
- **Better Balance**: More mutual initiation
- **Momentum Building**: Relationship is growing stronger

#### **Declining Scores** 📉
```
Previous Score: 82
Current Score: 73 (-9)
Trend: ↘️ Declining over last 30 days
```
- **Reduced Contact**: Longer gaps between encounters
- **Quality Issues**: Lower ratings for recent meetings
- **Imbalance Development**: One-sided initiation pattern
- **Natural Drift**: Relationship may be cooling naturally

#### **Stable Scores** ➡️
```
Previous Score: 71
Current Score: 72 (+1)
Trend: ➡️ Stable over last 30 days
```
- **Consistent Pattern**: Regular, predictable interaction rhythm
- **Established Baseline**: Relationship has found its natural level
- **Reliable Connection**: Steady quality and frequency
- **Mature Relationship**: Past growth phase, now maintaining

---

## 🔍 Advanced Algorithm Features

### Temporal Analysis

#### **Score History Tracking**
- **Daily Snapshots**: Algorithm scores calculated daily
- **Trend Analysis**: 7-day, 30-day, and 90-day trends
- **Historical Comparison**: How relationships evolve over time
- **Seasonal Patterns**: Identify recurring relationship cycles

#### **Predictive Elements**
- **Decay Prevention**: Identifies relationships at risk of declining
- **Growth Opportunities**: Suggests relationships with potential
- **Optimal Timing**: Recommends when to reach out based on patterns
- **Relationship Lifecycle**: Tracks natural relationship progression

### Personalization Learning

#### **Adaptive Weights**
- **Usage Pattern Analysis**: Learns from your interaction choices
- **Preference Detection**: Identifies your relationship priorities
- **Smart Suggestions**: Recommends algorithm adjustments
- **Behavior Modeling**: Adapts to your social style over time

#### **Individual Relationship Modeling**
- **Unique Baselines**: Each relationship has its own normal patterns
- **Context Awareness**: Considers relationship type and history
- **Expectation Adjustment**: Adapts to realistic frequency patterns
- **Quality Calibration**: Learns your rating tendencies per person

---

## 🎯 Algorithm Optimization Tips

### Maximizing Algorithm Accuracy

#### **Data Quality Best Practices**
1. **Consistent Rating**: Develop personal rating criteria and stick to them
2. **Accurate Timing**: Record encounters promptly and precisely
3. **Complete Information**: Fill in all relevant encounter details
4. **Honest Assessment**: Rate experiences authentically, not optimistically

#### **Pattern Recognition Support**
1. **Regular Usage**: Consistent app usage improves algorithm accuracy
2. **Varied Interactions**: Different activity types provide richer data
3. **Long-term Tracking**: Algorithm improves with historical data
4. **Relationship Diversity**: Track various relationship types for comparison

### Troubleshooting Algorithm Issues

#### **Unexpected Scores**
**Problem**: Friend scores don't match your intuition
**Solutions**:
1. Review your algorithm weights - adjust to match priorities
2. Check if recent encounters are skewing results
3. Verify encounter data accuracy (ratings, timing, etc.)
4. Consider if your relationship has actually changed

#### **All Scores Too Similar**
**Problem**: Everyone has similar scores, little differentiation
**Solutions**:
1. Increase weight spread - make some factors more important
2. Be more varied in your ratings (use full 1-5 scale)
3. Track more diverse interaction types
4. Check if you need more historical data for patterns

#### **Scores Change Too Rapidly**
**Problem**: Scores fluctuate dramatically with single encounters
**Solutions**:
1. Reduce recency weight if too sensitive to latest encounters
2. Increase minimum encounter threshold for stable scores
3. Review if encounter ratings are too extreme
4. Consider longer averaging periods in settings

---

## 📚 Algorithm Theory & Research

### Mathematical Foundation

#### **Weighted Composite Scoring**
```
Final Score = (Frequency × W_f) + (Recency × W_r) + 
              (Quality × W_q) + (Mutuality × W_m)

Where: W_f + W_r + W_q + W_m = 1.0
```

#### **Normalization Techniques**
- **Min-Max Scaling**: Scores normalized to 0-100 range
- **Percentile Ranking**: Relative scoring within your social circle
- **Standard Deviation**: Outlier detection and adjustment
- **Temporal Weighting**: Recent data weighted more heavily

### Behavioral Science Integration

#### **Relationship Psychology**
- **Mere Exposure Effect**: Frequency factor reflects familiarity preference
- **Recency Bias**: Recent interactions feel more important
- **Quality Over Quantity**: Satisfaction matters more than frequency
- **Reciprocity Principle**: Balanced relationships are healthier

#### **Social Network Theory**
- **Relationship Strength**: Multi-dimensional relationship assessment
- **Social Investment**: Resource allocation optimization
- **Network Density**: Relationship interconnectedness modeling
- **Tie Strength**: Weak vs strong social connection differentiation

---

*Next: [Interaction Types](Interaction-Types) →*