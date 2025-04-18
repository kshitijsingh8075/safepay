import streamlit as st
import pandas as pd
import folium
from folium.plugins import HeatMap
from streamlit_folium import folium_static
from geopy.geocoders import Nominatim
from datetime import datetime
import os
import matplotlib.pyplot as plt
import plotly.express as px
import plotly.graph_objects as go
import io
import base64

# Set page configuration
st.set_page_config(
    page_title="UPI Scam Detection - Fraud Map",
    page_icon="🗺️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Apply custom styling
st.markdown("""
<style>
    .main {
        background-color: #f5f7f9;
    }
    .stApp {
        max-width: 1200px;
        margin: 0 auto;
    }
    h1, h2, h3 {
        color: #5164BF;
    }
    .stButton button {
        background-color: #5164BF;
        color: white;
    }
    .info-box {
        background-color: #e8eaf6;
        padding: 20px;
        border-radius: 10px;
        margin-bottom: 20px;
    }
    .high-risk {
        color: #ff0000;
        font-weight: bold;
    }
    .medium-risk {
        color: #ff9800;
        font-weight: bold;
    }
    .low-risk {
        color: #4caf50;
        font-weight: bold;
    }
</style>
""", unsafe_allow_html=True)

def load_data():
    """Load scam data from CSV file"""
    try:
        # First try to load the enhanced dataset with scam type information
        try:
            df = pd.read_csv('updated_scam_data.csv')
            has_scam_types = True
        except:
            # If it's not available, load the original dataset
            df = pd.read_csv('scam_data.csv')
            has_scam_types = False
        
        df['Last Reported Date'] = pd.to_datetime(df['Last Reported Date'])
        return df, has_scam_types
    except Exception as e:
        st.error(f"Error loading data: {e}")
        return pd.DataFrame(), False

def generate_map(df, center_lat=20.5937, center_lng=78.9629, zoom=5, search_city=None):
    """Generate an interactive map with scam data"""
    # Create the base map centered on India
    m = folium.Map(location=[center_lat, center_lng], zoom_start=zoom, 
                  tiles="CartoDB positron")
    
    # Add a title to the map
    title_html = '''
        <h3 align="center" style="font-size:16px"><b>UPI Scam Density Across India</b></h3>
    '''
    m.get_root().html.add_child(folium.Element(title_html))
    
    # Prepare data for heatmap
    heat_data = [[row['Latitude'], row['Longitude'], row['Scam Cases']] for _, row in df.iterrows()]
    
    # Add heatmap layer
    HeatMap(heat_data, 
            radius=15, 
            gradient={0.2: 'blue', 0.4: 'lime', 0.6: 'yellow', 0.8: 'orange', 1: 'red'},
            min_opacity=0.5).add_to(m)
    
    # Add circle markers for each city
    for _, row in df.iterrows():
        # Determine marker color based on scam cases
        if row['Scam Cases'] > 400:
            color = 'red'
            risk = 'High Risk'
        elif row['Scam Cases'] > 200:
            color = 'orange'
            risk = 'Medium Risk'
        else:
            color = 'green'
            risk = 'Low Risk'
        
        # Create popup with city information
        popup_content = f"""
        <div style="width: 200px">
            <h4 style="color: #5164BF;">{row['City']}, {row['State']}</h4>
            <p><b>Scam Cases:</b> {row['Scam Cases']}</p>
            <p><b>Risk Level:</b> <span style="color:{color};">{risk}</span></p>
            <p><b>Last Reported:</b> {row['Last Reported Date'].strftime('%d %b %Y')}</p>
        </div>
        """
        
        # Add marker to map
        folium.CircleMarker(
            location=[row['Latitude'], row['Longitude']],
            radius=max(5, row['Scam Cases'] / 50),
            color=color,
            fill=True,
            fill_opacity=0.7,
            popup=folium.Popup(popup_content, max_width=300)
        ).add_to(m)
    
    # If a search city is specified, highlight it
    if search_city:
        city_data = df[df['City'] == search_city].iloc[0]
        folium.Marker(
            location=[city_data['Latitude'], city_data['Longitude']],
            icon=folium.Icon(color='blue', icon='info-sign'),
            popup=f"{search_city}: {city_data['Scam Cases']} scam cases"
        ).add_to(m)
    
    return m

def geocode_city(city_name, country="India"):
    """Get coordinates for a city using Geopy"""
    try:
        geolocator = Nominatim(user_agent="upi_scam_detector")
        location = geolocator.geocode(f"{city_name}, {country}")
        if location:
            return location.latitude, location.longitude
        return None, None
    except Exception as e:
        st.error(f"Error geocoding {city_name}: {e}")
        return None, None

def create_scam_type_chart(city_data):
    """Create a pie chart showing the breakdown of different scam types for a city"""
    # Get scam type columns (they all start with an uppercase letter and have an underscore)
    scam_type_cols = [col for col in city_data.index if '_' in col]
    
    if not scam_type_cols:
        return None  # No scam type data available
    
    # Get values and labels
    values = [city_data[col] for col in scam_type_cols]
    labels = [col.replace('_', ' ') for col in scam_type_cols]
    
    # If there are too many small segments, combine them into "Others"
    threshold = 0.05  # 5% threshold
    total = sum(values)
    small_indices = [i for i, v in enumerate(values) if v/total < threshold]
    
    if small_indices:
        others_value = sum(values[i] for i in small_indices)
        new_values = [v for i, v in enumerate(values) if i not in small_indices]
        new_labels = [l for i, l in enumerate(labels) if i not in small_indices]
        
        new_values.append(others_value)
        new_labels.append('Others')
        
        values = new_values
        labels = new_labels
    
    # Create pie chart with Plotly
    fig = go.Figure(data=[go.Pie(
        labels=labels,
        values=values,
        hole=.3,
        marker=dict(colors=px.colors.qualitative.Safe)
    )])
    
    fig.update_layout(
        title_text=f"Scam Type Distribution in {city_data['City']}",
        showlegend=True,
        legend=dict(orientation="h", yanchor="bottom", y=-0.2, xanchor="center", x=0.5),
        margin=dict(t=40, b=40, l=40, r=40),
        height=400
    )
    
    return fig

def add_new_city(df, city, state, scam_cases, has_scam_types=False):
    """Add a new city to the dataset"""
    lat, lng = geocode_city(f"{city}, {state}")
    
    if lat and lng:
        # Basic entry for all datasets
        new_entry = {
            "City": city,
            "State": state,
            "Scam Cases": scam_cases,
            "Latitude": lat,
            "Longitude": lng,
            "Last Reported Date": datetime.now().strftime('%Y-%m-%d')
        }
        
        # Add scam type data if using enhanced dataset
        if has_scam_types:
            # Distribute the scam cases across different types
            # This is a simple distribution for demonstration
            new_entry["UPI_Fraud"] = int(scam_cases * 0.4)  # 40% UPI Fraud
            new_entry["Fake_Store"] = int(scam_cases * 0.2)  # 20% Fake Store
            new_entry["Phishing"] = int(scam_cases * 0.15)  # 15% Phishing
            new_entry["Investment"] = int(scam_cases * 0.15)  # 15% Investment
            new_entry["QR_Code"] = int(scam_cases * 0.05)  # 5% QR Code
            new_entry["Others"] = scam_cases - sum([new_entry["UPI_Fraud"], new_entry["Fake_Store"], 
                                               new_entry["Phishing"], new_entry["Investment"], 
                                               new_entry["QR_Code"]])  # Remainder to make sure it adds up
        
        # Save to appropriate file
        new_df = pd.concat([df, pd.DataFrame([new_entry])], ignore_index=True)
        if has_scam_types:
            new_df.to_csv('updated_scam_data.csv', index=False)
        else:
            new_df.to_csv('scam_data.csv', index=False)
        
        return new_df, True
    
    return df, False

def main():
    """Main function for the Streamlit app"""
    # Header
    st.title("🗺️ UPI Fraud Heatmap")
    st.markdown("""
    <div class="info-box">
        This interactive map shows UPI scam density across major cities in India.
        <ul>
            <li><span class="high-risk">Red circles</span> indicate high-risk areas (>400 scam cases)</li>
            <li><span class="medium-risk">Orange circles</span> indicate medium-risk areas (200-400 scam cases)</li>
            <li><span class="low-risk">Green circles</span> indicate low-risk areas (<200 scam cases)</li>
        </ul>
        Click on any circle to view detailed information about that location.
    </div>
    """, unsafe_allow_html=True)
    
    # Load data
    df = load_data()
    
    if df.empty:
        st.warning("No data available. Please check the data file.")
        return
    
    # Create sidebar for controls
    with st.sidebar:
        st.header("Map Controls")
        
        # Date filter
        st.subheader("Filter by Date")
        min_date = df['Last Reported Date'].min().date()
        max_date = df['Last Reported Date'].max().date()
        selected_date = st.date_input(
            "Show data up to:",
            value=max_date,
            min_value=min_date,
            max_value=max_date
        )
        
        # Filter data by date
        filtered_df = df[df['Last Reported Date'].dt.date <= selected_date]
        
        # Search functionality
        st.subheader("Search Location")
        search_city = st.selectbox(
            "Select a city to highlight:",
            options=[""] + sorted(df['City'].unique().tolist())
        )
        
        # Display city stats if selected
        if search_city:
            city_data = df[df['City'] == search_city].iloc[0]
            st.markdown(f"""
            ### {search_city} Stats
            - **Scam Cases:** {city_data['Scam Cases']}
            - **Last Reported:** {city_data['Last Reported Date'].strftime('%d %b %Y')}
            - **State:** {city_data['State']}
            """)
            
            # Risk level indicator
            risk_level = "High Risk" if city_data['Scam Cases'] > 400 else "Medium Risk" if city_data['Scam Cases'] > 200 else "Low Risk"
            risk_color = "red" if risk_level == "High Risk" else "orange" if risk_level == "Medium Risk" else "green"
            st.markdown(f"- **Risk Level:** <span style='color:{risk_color};font-weight:bold;'>{risk_level}</span>", unsafe_allow_html=True)
        
        # Add new city section (admin only)
        st.subheader("Add New City (Admin)")
        with st.expander("Expand to add new data"):
            new_city = st.text_input("City Name")
            new_state = st.text_input("State")
            new_cases = st.number_input("Scam Cases", min_value=1, value=100)
            
            if st.button("Add City"):
                if new_city and new_state:
                    updated_df, success = add_new_city(df, new_city, new_state, new_cases)
                    if success:
                        st.success(f"Added {new_city}, {new_state} with {new_cases} scam cases")
                        df = updated_df
                    else:
                        st.error(f"Failed to geocode {new_city}, {new_state}")
                else:
                    st.warning("Please enter both city and state")
    
    # Main content area for map
    zoom_level = 5
    center_lat = 20.5937
    center_lng = 78.9629
    
    # If a city is selected, center the map on it
    if search_city:
        city_data = df[df['City'] == search_city].iloc[0]
        center_lat = city_data['Latitude']
        center_lng = city_data['Longitude']
        zoom_level = 8
    
    # Generate and display the map
    m = generate_map(
        filtered_df, 
        center_lat=center_lat, 
        center_lng=center_lng,
        zoom=zoom_level,
        search_city=search_city if search_city else None
    )
    
    folium_static(m, width=1100, height=600)
    
    # Display data table
    st.subheader("Scam Data by City")
    st.dataframe(
        filtered_df[['City', 'State', 'Scam Cases', 'Last Reported Date']].sort_values(
            by='Scam Cases', ascending=False
        ),
        use_container_width=True
    )
    
    # Download options
    col1, col2 = st.columns(2)
    with col1:
        if st.button("Download Map as HTML"):
            m.save("fraud_map.html")
            with open("fraud_map.html", "rb") as file:
                btn = st.download_button(
                    label="Click to Download",
                    data=file,
                    file_name="fraud_map.html",
                    mime="text/html"
                )
    
    with col2:
        if st.button("Download Scam Data CSV"):
            csv = df.to_csv(index=False)
            st.download_button(
                label="Click to Download",
                data=csv,
                file_name="scam_data.csv",
                mime="text/csv"
            )

if __name__ == "__main__":
    main()