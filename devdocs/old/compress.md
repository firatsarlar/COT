Here's the complete text compression prompt template:

---

# **TEXT COMPRESSION PROMPT TEMPLATE**

**Context State**: [WITH_CONTEXT / WITHOUT_CONTEXT]  
**Target Compression**: [50% / 70% / EXTREME]  
**Text Type**: [TECHNICAL / NARRATIVE / INSTRUCTIONS / REPORT / CODE / MIXED]  
**Special Requirements**: [PRESERVE_NUMBERS / MAINTAIN_FLOW / KEEP_STRUCTURE]

## **CONTEXT-AWARE COMPRESSION RULES**

**WITH_CONTEXT** (can reconstruct details):
- Maximum abstraction acceptable
- Use patterns/approaches over implementations
- Signal quality requirements only

**WITHOUT_CONTEXT** (standalone clarity needed):
- Preserve implementation hints
- Include critical constraints
- Mark context dependencies

## **UNIVERSAL COMPRESSION TECHNIQUES**
1. Remove redundancy, filler words, obvious context
2. Merge related concepts into single statements
3. Replace verbose phrases with precise terms
4. Extract only essential facts/actions/logic
5. Convert examples to patterns when possible

## **TYPE-SPECIFIC EXAMPLES**

### **1. TECHNICAL (50% compression)**
Original: "The system processes user requests by first validating the input parameters, then checking authentication credentials, followed by executing the requested operation, and finally returning the formatted response to the client."

Compressed: "System validates input, checks authentication, executes operation, returns formatted response."

### **2. NARRATIVE (70% compression)**
Original: "Sarah walked slowly through the dense forest, carefully avoiding the twisted roots and fallen branches that littered the narrow path. The morning sunlight filtered through the canopy above, creating patterns of light and shadow on the forest floor."

Compressed: "Sarah navigated the root-strewn forest path as morning light filtered through."

### **3. INSTRUCTIONS (Extreme compression)**
Original: "To reset your password, navigate to the login page and click on the 'Forgot Password' link located below the password field. Enter your registered email address in the form that appears. Check your email inbox for a reset link, which will expire in 24 hours. Click the link and create a new password following the security requirements."

Compressed: "Reset password: Login page → 'Forgot Password' → Enter email → Click emailed link → Set new password."

### **4. REPORT (Mixed compression)**
Original: "Q3 sales increased by 15% compared to the previous quarter, driven primarily by strong performance in the Asia-Pacific region where we saw 28% growth. European markets remained stable with 3% growth, while North American sales declined by 5% due to increased competition."

Compressed: "Q3 sales +15%: APAC +28%, Europe +3%, NA -5% (competition)."

### **5. CODE COMPRESSION**

**a) Simple Utility (context-independent):**
Original:
```python
def validate_email(email):
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if re.match(pattern, email):
        return True
    return False
```

WITH_CONTEXT: "Email validator: regex pattern"  
WITHOUT_CONTEXT: "Email validator: regex ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"

**b) Complex Implementation (context-dependent):**
Original: [50+ line route optimization with constraints]

WITH_CONTEXT: "Route optimizer: DP + 2-opt, considers time/capacity"  
WITHOUT_CONTEXT: 
```
Route optimizer:
- Core: DP(vehicle_idx, time, capacity, visited_mask)
- Constraints: time_windows[], vehicle_capacity
- Initial: nearest_neighbor → 2-opt refinement
- *Handles: concurrent deliveries, real-time updates*
```

## **QUALITY PRESERVATION GUIDELINES**

**Always Preserve**:
- Numbers, metrics, percentages
- Proper nouns, technical terms
- Causal relationships ("due to", "because")
- Temporal sequences
- Critical constraints/requirements

**Context Markers**:
- `*Context Required*`: Full understanding needs domain knowledge
- `[Quality: ...]`: Specific performance/security requirements  
- `{Preserves: ...}`: Subtle behaviors that might be missed
- `→`: Sequential steps or flow
- `+/-`: Increases/decreases with values

## **USAGE INSTRUCTIONS**

1. Identify context state and required compression level
2. Apply appropriate compression techniques for text type
3. Use context markers when quality depends on understanding
4. Verify core meaning and critical details preserved
5. Test if compressed version can guide accurate reconstruction

---

**Template Variables**:
- Replace [CONTEXT_STATE] with actual state
- Set [COMPRESSION_RATIO] target
- Specify [TEXT_TYPE] for focused approach
- Add [SPECIAL_REQUIREMENTS] as needed

Need specific customization or additional text types?