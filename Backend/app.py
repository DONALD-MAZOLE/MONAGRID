# app.py
import streamlit as st
import tensorflow as tf
import numpy as np
from PIL import Image, ImageOps
import pandas as pd
import os
from pathlib import Path
import base64

# 1. Page Configuration
st.set_page_config(
    layout='wide', 
    page_title="Monagrid.com",
)

# 2. Dynamic Path Resolutions
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = os.path.join(BASE_DIR, "model_unquant.tflite")
LABELS_PATH = os.path.join(BASE_DIR, "labels.txt")
LOGO_PATH = os.path.join(BASE_DIR, "Monagrid.png")

@st.cache_resource
def load_model():
    """Load the TFLite model and cache it to avoid reloading on every rerun"""
    interpreter = tf.lite.Interpreter(model_path=MODEL_PATH)
    interpreter.allocate_tensors()
    return interpreter

def process_image(image):
    """Normalize and format image arrays for Teachable Machine standard inputs"""
    size = (224, 224)
    image = ImageOps.fit(image, size, Image.Resampling.LANCZOS)
    image_array = np.asarray(image)
    normalized_image_array = (image_array.astype(np.float32) / 127.5) - 1
    data = np.ndarray(shape=(1, 224, 224, 3), dtype=np.float32)
    data[0] = normalized_image_array
    return data

def predict(interpreter, image_data):
    """Run model evaluation"""
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    interpreter.set_tensor(input_details[0]['index'], image_data)
    interpreter.invoke()
    return interpreter.get_tensor(output_details[0]['index'])[0]

def format_condition(condition):
    """Map raw text label parts to operational asset standard phrasing"""
    if "Physical" in condition:
        return "Physical Structural Damage"
    elif "Electrical" in condition:
        return "Electrical Circuitry Anomaly"
    elif "Dusty" in condition:
        return "Soiling / Dust Accumulation"
    elif "Bird" in condition:
        return "Bio-Fouling (Bird Droppings)"
    elif "Clean" in condition:
        return "Optimal Operational State"
    return condition

def main():
    # Ensure a place to store the last fleet CSV so the download is always available
    st.session_state.setdefault('fleet_csv', None)

    # Hide Streamlit main menu (removes Print option) and footer for a cleaner kiosk-like UI
    st.markdown(
        """
        <style>
        #MainMenu{visibility: hidden;} /* removes the three-dot menu including Print */
        footer{visibility: hidden;}   /* hides footer */
        </style>
        """,
        unsafe_allow_html=True
    )

    # --- MAIN SYSTEM MONITOR HEADER (no sidebar) ---
    # Inject green/orange theme and responsive hero header
    st.markdown(
        """
        <style>
        :root{--mg-green:#2e7d32; --mg-orange:#fb8c00; --mg-light:#f7fff7; --mg-dark:#1b3a2b; --mg-yellow:#fdd835}
        /* Force pure black background across the app including header/topbars */
        html, body, .stApp, .main, .block-container, .stContainer, .reportview-container, header, nav, .css-18e3th9, .css-1v3fvcr { background-color: #000 !important; color: #eaeaea !important; }
        /* Remove top border/shadow that creates the lighter stripe */
        header, .css-18e3th9, .css-1v3fvcr { box-shadow: none !important; border-bottom: none !important; }
        /* Make sure panels and blocks are transparent on top of black */
        [data-testid="stBlock"], .css-1lcbmhc, .css-18e3th9, .stBlock { background-color: transparent !important; }
        /* Buttons - warm gradient between green and orange */
        .stButton>button{background:linear-gradient(90deg,var(--mg-green),var(--mg-orange))!important;color:#fff!important;border-radius:8px!important;border:none!important;padding:8px 12px!important}
        /* Progress bar accent */
        .stProgress>div>div>div{background:var(--mg-green)!important}
        /* Make metric deltas and text feel organic */
        .stMetric{background:transparent}
        /* Headings and text color adjustments */
        h1, h2, h3, h4, h5, .stMarkdown, .stText, .css-1d391kg { color: #ffffff !important; }
        /* Compact report badge */
        .report-badge{background:transparent; border-left:6px solid var(--mg-green); padding:10px; border-radius:6px}
        @media (max-width:600px){ .stButton>button{width:100%!important} }
        /* Logo and CTA size adjustments */
        .logo-sticky img{width:160px !important}
        .logo-tagline{font-size:16px !important; padding-left:8px !important}

        /* Tabs: default white labels, selected tab red with underline */
        [role="tab"] { color: #ffffff !important; }
        [role="tab"][aria-selected="true"] { color: #ff5252 !important; border-bottom: 3px solid #ff5252 !important; }

        /* File uploader instruction and helper text should be white */
        .stFileUploader, .stFileUploader label, .stFileUploader div, .stFileUploadButton, label, .stText { color: #ffffff !important; }

        /* Uploader panel visual match to provided design: dark rounded container with compact dark upload button */
        [data-testid="stFileUploader"], .stFileUploader {
            background-color: #2f3136 !important; /* container dark gray/brown */
            border-radius: 12px !important;
            padding: 12px 16px !important;
            border: 1px solid rgba(255,255,255,0.03) !important;
        }

        /* Ensure every inner element in the uploader inherits the dark background (override Streamlit's default light inner) */
        .stApp [data-testid="stFileUploader"] *, .stApp .stFileUploader * {
            background: transparent !important;
            background-color: transparent !important;
            box-shadow: none !important;
            color: inherit !important;
        }

        /* Force the immediate inner panels to be transparent so the container's dark color shows */
        .stApp [data-testid="stFileUploader"] > div, .stApp .stFileUploader > div { background: transparent !important; }

        /* Re-style the upload button explicitly so it stays visible and dark */
        [data-testid="stFileUploader"] button, .stFileUploader .stButton>button, .stFileUploader button {
            background-color: #1f2226 !important; /* nearly black button */
            color: #ffffff !important;
            border-radius: 8px !important;
            padding: 8px 12px !important;
            border: 1px solid rgba(255,255,255,0.12) !important; /* slightly more visible white boundary */
            box-shadow: 0 2px 6px rgba(0,0,0,0.45) inset, 0 1px 0 rgba(255,255,255,0.03) !important;
            height: 38px !important;
        }

        /* Uploader helper text (e.g. "200MB per file • JPG, PNG") should be a soft gray */
        [data-testid="stFileUploader"] .stText, [data-testid="stFileUploader"] label, .stFileUploader .stText, .stFileUploader label {
            color: #cfcfcf !important;
            font-size: 14px !important;
            background: transparent !important;
        }

        /* Accent color for the small hint text (blue-ish) to match image */
        [data-testid="stFileUploader"] .stText small, .stFileUploader small { color: #9fb3ff !important; background: transparent !important }
     
        /* Maintain responsiveness */
        @media (max-width:600px){ [data-testid="stFileUploader"] { padding:10px !important } [data-testid="stFileUploader"] button { height:36px !important } }
    
        /* Tweak selected tab background/indicator removal to keep clean black look */
        [role="tab"][aria-selected="true"]:not(:focus) { background: transparent !important; box-shadow: none !important; }
        </style>
        """,
        unsafe_allow_html=True
    )

    # Minimal sticky logo at top-left for a clean UI (no tagline or extra text)
    if os.path.exists(LOGO_PATH):
        with open(LOGO_PATH, 'rb') as img_f:
            _b64 = base64.b64encode(img_f.read()).decode()
        st.markdown(
            f"""
            <style>
            /* Raised sticky logo: align horizontally with a tight CTA */
            .logo-sticky{{position:sticky; top:2px; left:8px; z-index:9999; padding:2px 6px; background:transparent; display:flex; flex-direction:row; align-items:center; gap:8px}}
            .logo-sticky img{{width:160px !important; height:auto; border-radius:6px; box-shadow:0 6px 12px rgba(0,0,0,0.25)}}
            /* CTA very close to logo */
            .logo-tagline{{font-style:italic; color:var(--mg-yellow); font-weight:600; margin:0; padding-left:8px !important; font-size:16px !important}}
            /* Raise main content closer to the top */
            .block-container{{padding-top:8px !important}}
            /* Slightly tighten divider spacing */
            hr{{margin-top:6px !important; margin-bottom:6px !important}}
            @media (max-width:600px){{ .logo-sticky img{{width:100px}} .logo-tagline{{font-size:12px; padding-left:4px}} .block-container{{padding-top:6px !important}} }}
            </style>
            <div class='logo-sticky'>
                <img src='data:image/png;base64,{_b64}' alt='Monagrid logo'/>
                <div class='logo-tagline'>Improving solar efficiency</div>
            </div>
            """,
            unsafe_allow_html=True
        )
    else:
        st.markdown("")

    # Persistent download controls moved to header area (replaces sidebar download)
    if st.session_state.get('fleet_csv'):
        dl_col1, dl_col2 = st.columns([4,1])
        with dl_col2:
            st.download_button(
                "Download Last Fleet CSV",
                st.session_state['fleet_csv'],
                "monagrid_fleet_maintenance_report.csv",
                "text/csv",
                key="header_download"
            )
            if st.button("Clear", key="clear_report_header"):
                st.session_state['fleet_csv'] = None

    # clean separator
    st.write("---")
    
    try:
        interpreter = load_model()
        with open(LABELS_PATH, "r") as f:
            labels = [line.strip() for line in f.readlines()]
        
        tab1, tab2 = st.tabs(["Single Analysis", "Batch Analysis"])
        
        # --- TAB 1: SINGLE ASSET ---
        with tab1:
            st.markdown("### **Real-time Panel Inspection**")
            uploaded_file = st.file_uploader("Upload a single image of a solar panel", type=['jpg', 'png', 'jpeg'], key="single_uploader")

            if uploaded_file:
                # reduce gap so image and action sit closer together on mobile
                col1, col2 = st.columns([1, 1], gap="small")

                with col1:
                    image = Image.open(uploaded_file).convert('RGB')
                    st.image(image, caption=f"Inspection Target ID: {uploaded_file.name}", use_container_width=True)

                with col2:
                    # Single clear CTA for mobile-first workflows
                    if st.button("Analyze Image", type="primary"):
                        with st.spinner("Parsing localized visual features..."):
                            processed_image = process_image(image)
                            predictions = predict(interpreter, processed_image)
                            
                            class_index = np.argmax(predictions)
                            confidence = predictions[class_index]
                            
                            # Safely extract condition keyword (e.g. 'Dusty', 'Physical', 'Bird', etc.)
                            condition = labels[class_index].split(' ')[1]
                            condition_display = format_condition(condition)
                            
                            st.write("---")
                            st.markdown("### **Analysis results**")
                            
                            # Reworked result cards using green / orange palette only
                            if condition == "Clean":
                                st.markdown(f"<div style='background-color:#e8f5e9; padding:15px; border-radius:8px; border-left:6px solid #2e7d32; color:#1b3a2b;'><strong>STATUS: {condition_display.upper()}</strong><br>Asset is operating within ideal structural and electrical parameters.</div>", unsafe_allow_html=True)
                            elif condition in ["Dusty", "Bird"]:
                                st.markdown(f"<div style='background-color:#fff8e1; padding:15px; border-radius:8px; border-left:6px solid #fb8c00; color:#5b4520;'><strong>NOTICE: {condition_display.upper()}</strong><br>Performance drop detected due to surface obstruction. Schedule optimized wash cycle down-string.</div>", unsafe_allow_html=True)
                            elif condition == "Physical":
                                st.markdown(f"<div style='background-color:#fff3e0; padding:15px; border-radius:8px; border-left:6px solid #fb8c00; color:#4b2f0d;'><strong>WARNING: {condition_display.upper()}</strong><br>Visual damage or panel micro-cracks identified. Schedule routine maintenance check.</div>", unsafe_allow_html=True)
                            else: # Electrical Damage
                                st.markdown(f"<div style='background-color:#fff8f3; padding:15px; border-radius:8px; border-left:6px solid #d84315; color:#4b2b1f;'><strong>CRITICAL ALARM: {condition_display.upper()}</strong><br>Hotspot patterns or internal module failure suspected. High risk of drop in string generation.</div>", unsafe_allow_html=True)
                            
                            st.write("")
                            st.metric(label="Model Identification Confidence", value=f"{confidence * 100:.2f}%")
                            
                            st.markdown("##### **Probability Distribution Matrix**")
                            for idx, score in enumerate(predictions):
                                label = labels[idx].split(' ')[1]
                                label_display = format_condition(label)
                                st.caption(f"**{label_display}**: {score * 100:.1f}%")
                                st.progress(float(score))
        
        # --- TAB 2: BATCH FLEET OPERATIONS ---
        with tab2:
            st.markdown("### **Fleet Asset Batch Aggregator**")
            uploaded_files = st.file_uploader("Upload multiple images of solar panels", 
                                            type=['jpg', 'png', 'jpeg'],
                                            accept_multiple_files=True, key="batch_uploader")
            
            if uploaded_files:
                if st.button("Analyze Fleet Array", type="primary"):
                    results = []
                    progress = st.progress(0)
                    status = st.empty()
                    
                    for idx, file in enumerate(uploaded_files):
                        status.markdown(f"`System status: Processing node {idx + 1} of {len(uploaded_files)}...`")
                        try:
                            image = Image.open(file).convert('RGB')
                            processed_image = process_image(image)
                            predictions = predict(interpreter, processed_image)
                            
                            class_index = np.argmax(predictions)
                            confidence = predictions[class_index]
                            condition = labels[class_index].split(' ')[1]
                            condition_display = format_condition(condition)
                            
                            results.append({
                                'Asset Identification File': file.name,
                                'Operational Status Evaluation': condition_display,
                                'Precision Confidence Level': f"{confidence:.2%}"
                            })
                        except Exception as e:
                            results.append({
                                'Asset Identification File': file.name,
                                'Operational Status Evaluation': 'Processing Malfunction',
                                'Precision Confidence Level': str(e)
                            })
                        progress.progress((idx + 1) / len(uploaded_files))
                    
                    status.success("🚀 Complete Fleet Evaluation Array Compiled Successfully!")
                    df = pd.DataFrame(results)
                    
                    # Dashboard Metrics Row
                    total = len(df)
                    # Filter for issues that require human interaction (Physical, Electrical, Dust, Bird)
                    problems = len(df[~df['Operational Status Evaluation'].str.contains('Optimal', na=False)])
                    clean = total - problems;
                    
                    m1, m2, m3 = st.columns(3)
                    m1.metric("Total Array Scope Evaluated", f"{total} Modules")
                    m2.metric("Action Required (Fault Tracker)", f"{problems} Anomalies", delta=f"{problems} Risks" if problems > 0 else "0 Risks", delta_color="inverse")
                    m3.metric("Nominal Capacity Array Modules", f"{clean} Active")
                    
                    st.markdown("### **Fleet Structural Audit Log**")
                    # Wrap the table in an expander to keep page height in check on mobile while still being easy to open
                    with st.expander("Fleet Structural Audit Log (expand to view table)", expanded=True):
                        st.dataframe(df, use_container_width=True)
                        
                    csv = df.to_csv(index=False)
                    # Store the CSV in session state and surface the download in the header so users never have to scroll far to download
                    st.session_state['fleet_csv'] = csv
                    st.success("Fleet CSV prepared — use the 'Download Last Fleet CSV' control at the top to download the report.")
        
    except FileNotFoundError:
        st.error("System Malfunction: Core files missing from workspace environment.")
        st.info(f"Target verification trace lines:\n- Model Resource Location: {MODEL_PATH}\n- Target Labels Configuration: {LABELS_PATH}")
    except Exception as e:
        st.error(f"Platform Error: {str(e)}")

if __name__ == "__main__":
    main()