# 🎯 IRR-SDM Platform – Full Update
## Loading All Camps on the Map

---

## 📖 About the Platform

IRR-SDM is a web-based spatial decision-support platform for assessing displacement camps in Aleppo and Idleb, Syria. Camp data is loaded from Excel records and shown on an interactive map. The user selects a camp, enters the assessment criteria, and the platform calculates a final score (FS) and recommends a durable-solutions pathway: immediate return, phased return, organized relocation, local integration, or no return. Results are color-coded on the map and summarized in analytics and results tabs.

---

## ✅ Problem Solved

**The problem:**
- The map displayed only **calculated** camps
- Only one camp (Al-Nadwara) appeared after it was calculated
- All other camps in Aleppo and Idleb were not visible

**The solution:**
✅ **All camps** from Aleppo and Idleb are displayed on the map when the platform opens
✅ Uncalculated camps appear in blue 🔵
✅ Any camp can be selected from the map or from the list

---

## 🎨 Color System

| Color | Status | Description |
|-------|--------|-------------|
| 🔵 Blue | Not calculated | Click to select it |
| 🟢 Green | Immediate Return | FS ≥ 4.0 |
| 🟡 Yellow | Phased Return | FS 3.0–3.9 |
| 🟠 Orange | Organized Relocation | FS 2.0–2.9 |
| 🔶 Light orange | Local Integration | FS 1.5–1.9 |
| 🔴 Red | No Return | FS < 1.5 |

---

## 📋 Changes

### 1. index.html
✅ Added a camps list section with a search box
✅ Updated the map legend with the new colors and labels

### 2. script.js
✅ Updated `updateMapMarkers()` to show both calculated and uncalculated camps
✅ Added a call to `updateMapMarkers()` inside `loadCampsList()`
✅ Interactive popups with a "Select for assessment" button

### 3. style.css
✅ Added styles for the camps list
✅ Added hover and selected effects

---

## 🎬 How to Use

### When the platform opens:
- All camps appear in blue 🔵

### To select a camp:
**From the map:**
1. Click a blue marker 🔵
2. Press "Select for assessment"

**From the list:**
1. Search in the search box
2. Click the camp name

### After calculation:
- The camp's color changes according to the result
- All other camps remain blue

---

## 📊 Example

### Before calculation:
```
Aleppo: 🔵 Al-Nadwara | 🔵 Al-Shahba | 🔵 Zeidan
Idleb:  🔵 Al-Karama  | 🔵 Deir Hassan
```

### After calculating two camps:
```
Aleppo: 🟢 Al-Nadwara | 🔵 Al-Shahba | 🔵 Zeidan
Idleb:  🟡 Al-Karama  | 🔵 Deir Hassan
```

---

## 🚀 Installation

```bash
# 1. Replace the files
cp outputs/index.html templates/index.html
cp outputs/script.js static/script.js
cp outputs/style.css static/style.css

# 2. Restart the server
python app.py
```

---

## 📁 Files

```
outputs/
├── index.html    ← HTML with the camps list
├── script.js     ← Updated JavaScript
├── style.css     ← Updated CSS
├── app.py        ← Unchanged
└── README.md     ← This file
```

---

**Last updated**: February 16, 2026
**Developers**: Dr. Alaa Khallouf & Maha Hana

🎉 **Ready to use!**
