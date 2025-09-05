document.addEventListener('DOMContentLoaded', () => {
    // Using one of the existing API keys from your table
    const apiKey = '451480c7101073812eeabfc84ea9d6a3'; // Using the Default key
    
    const searchContainer = document.querySelector('.search-container');
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    const autocompleteDropdown = document.querySelector('.autocomplete-dropdown');
    const locationElement = document.querySelector('.location');
    const dateElement = document.querySelector('.date');
    const tempElement = document.querySelector('.temp');
    const descriptionElement = document.querySelector('.description');
    const windElement = document.querySelector('.detail-item:nth-child(1) .detail-value');
    const humidityElement = document.querySelector('.detail-item:nth-child(2) .detail-value');
    const pressureElement = document.querySelector('.detail-item:nth-child(3) .detail-value');
    const weatherIconElement = document.querySelector('.weather-icon i');
    const loadingElement = document.querySelector('.loading');
    const errorMessage = document.querySelector('.error-message');
    
    // Default city
    let city = 'New York';
    let debounceTimer;
    
    // Get current date
    function getCurrentDate() {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        
        const currentDate = new Date();
        const day = days[currentDate.getDay()];
        const date = currentDate.getDate();
        const month = months[currentDate.getMonth()];
        const year = currentDate.getFullYear();
        
        return `${day}, ${month} ${date}, ${year}`;
    }
    
    // Set current date
    dateElement.textContent = getCurrentDate();
    
    // Function to get city suggestions (autocomplete)
    async function getCitySuggestions(query) {
        if (query.length < 1) {
            autocompleteDropdown.style.display = 'none';
            return;
        }
        
        try {
            // Use a more specific query to get cities that start with the input
            const url = `https://api.openweathermap.org/geo/1.0/direct?q=${query}*&limit=20&appid=${apiKey}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Failed to fetch city suggestions');
            }
            
            const data = await response.json();
            
            // Filter results to only include cities that start with the query (case insensitive)
            const filteredCities = data.filter(city => 
                city.name.toLowerCase().startsWith(query.toLowerCase())
            );
            
            displayCitySuggestions(filteredCities);
        } catch (error) {
            console.error('Error fetching city suggestions:', error);
            autocompleteDropdown.style.display = 'none';
        }
    }
    
    // Function to display city suggestions
    function displayCitySuggestions(cities) {
        autocompleteDropdown.innerHTML = '';
        
        if (cities.length === 0) {
            autocompleteDropdown.style.display = 'none';
            return;
        }
        
        // Sort cities alphabetically by name
        cities.sort((a, b) => a.name.localeCompare(b.name));
        
        cities.forEach(city => {
            const item = document.createElement('div');
            item.classList.add('autocomplete-item');
            
            const cityName = document.createElement('span');
            cityName.classList.add('city-name');
            cityName.textContent = city.name;
            
            const countryName = document.createElement('span');
            countryName.classList.add('country-name');
            countryName.textContent = city.country;
            
            if (city.state) {
                const stateName = document.createElement('span');
                stateName.classList.add('country-name');
                stateName.textContent = `, ${city.state}`;
                countryName.appendChild(stateName);
            }
            
            item.appendChild(cityName);
            item.appendChild(countryName);
            
            item.addEventListener('click', () => {
                searchInput.value = `${city.name}${city.state ? `, ${city.state}` : ''}, ${city.country}`;
                autocompleteDropdown.style.display = 'none';
                getWeatherData(searchInput.value);
            });
            
            autocompleteDropdown.appendChild(item);
        });
        
        // Show a message if there are more results
        if (cities.length >= 20) {
            const moreItem = document.createElement('div');
            moreItem.classList.add('autocomplete-item', 'more-results');
            moreItem.textContent = `More results available...`;
            moreItem.style.fontStyle = 'italic';
            moreItem.style.color = '#666';
            autocompleteDropdown.appendChild(moreItem);
        }
        
        autocompleteDropdown.style.display = 'block';
    }
    
    // Function to get weather data
    async function getWeatherData(cityName) {
        try {
            showLoading();
            autocompleteDropdown.style.display = 'none';
            
            // Current weather
            const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}&units=metric`;
            const currentWeatherResponse = await fetch(currentWeatherUrl);
            
            // Check for API key issues
            if (currentWeatherResponse.status === 401) {
                throw new Error('Invalid API key. Please check your API key in script.js.');
            }
            
            if (currentWeatherResponse.status === 404) {
                throw new Error('City not found. Please check the city name.');
            }
            
            if (!currentWeatherResponse.ok) {
                throw new Error(`API error: ${currentWeatherResponse.status}`);
            }
            
            const currentWeatherData = await currentWeatherResponse.json();
            
            // 5-day forecast
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${apiKey}&units=metric`;
            const forecastResponse = await fetch(forecastUrl);
            
            if (!forecastResponse.ok) {
                throw new Error(`Forecast API error: ${forecastResponse.status}`);
            }
            
            const forecastData = await forecastResponse.json();
            
            // Update UI with current weather
            updateWeatherUI(currentWeatherData);
            
            // Update UI with forecast
            updateForecastUI(forecastData);
            
            hideLoading();
        } catch (error) {
            hideLoading();
            showError(error.message);
            console.error('Error fetching weather data:', error);
        }
    }
    
    // Function to update weather UI
    function updateWeatherUI(data) {
        locationElement.textContent = data.name;
        tempElement.textContent = `${Math.round(data.main.temp)}°C`;
        descriptionElement.textContent = data.weather[0].description;
        windElement.textContent = `${data.wind.speed} km/h`;
        humidityElement.textContent = `${data.main.humidity}%`;
        pressureElement.textContent = `${data.main.pressure} hPa`;
        
        // Update weather icon
        const iconCode = data.weather[0].icon;
        updateWeatherIcon(iconCode);
    }
    
    // Function to update forecast UI
    function updateForecastUI(data) {
        const forecastContainer = document.querySelector('.forecast');
        forecastContainer.innerHTML = '';
        
        // Get 5-day forecast (one forecast per day)
        const dailyData = {};
        
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            if (!dailyData[day]) {
                dailyData[day] = {
                    minTemp: item.main.temp_min,
                    maxTemp: item.main.temp_max,
                    icon: item.weather[0].icon
                };
            } else {
                if (item.main.temp_min < dailyData[day].minTemp) {
                    dailyData[day].minTemp = item.main.temp_min;
                }
                if (item.main.temp_max > dailyData[day].maxTemp) {
                    dailyData[day].maxTemp = item.main.temp_max;
                }
            }
        });
        
        // Create forecast elements
        Object.keys(dailyData).slice(0, 5).forEach(day => {
            const forecastDay = document.createElement('div');
            forecastDay.classList.add('forecast-day');
            
            const dayName = document.createElement('p');
            dayName.classList.add('day-name');
            dayName.textContent = day;
            
            const icon = document.createElement('i');
            icon.classList.add('fas');
            updateForecastIcon(icon, dailyData[day].icon);
            
            const dayTemp = document.createElement('p');
            dayTemp.classList.add('day-temp');
            dayTemp.textContent = `${Math.round(dailyData[day].maxTemp)}°/${Math.round(dailyData[day].minTemp)}°`;
            
            forecastDay.appendChild(dayName);
            forecastDay.appendChild(icon);
            forecastDay.appendChild(dayTemp);
            
            forecastContainer.appendChild(forecastDay);
        });
    }
    
    // Function to update weather icon
    function updateWeatherIcon(iconCode) {
        const iconMap = {
            '01d': 'fa-sun',
            '01n': 'fa-moon',
            '02d': 'fa-cloud-sun',
            '02n': 'fa-cloud-moon',
            '03d': 'fa-cloud',
            '03n': 'fa-cloud',
            '04d': 'fa-cloud',
            '04n': 'fa-cloud',
            '09d': 'fa-cloud-showers-heavy',
            '09n': 'fa-cloud-showers-heavy',
            '10d': 'fa-cloud-sun-rain',
            '10n': 'fa-cloud-moon-rain',
            '11d': 'fa-bolt',
            '11n': 'fa-bolt',
            '13d': 'fa-snowflake',
            '13n': 'fa-snowflake',
            '50d': 'fa-smog',
            '50n': 'fa-smog'
        };
        
        weatherIconElement.className = 'fas ' + iconMap[iconCode] || 'fa-sun';
    }
    
    // Function to update forecast icon
    function updateForecastIcon(iconElement, iconCode) {
        const iconMap = {
            '01d': 'fa-sun',
            '01n': 'fa-moon',
            '02d': 'fa-cloud-sun',
            '02n': 'fa-cloud-moon',
            '03d': 'fa-cloud',
            '03n': 'fa-cloud',
            '04d': 'fa-cloud',
            '04n': 'fa-cloud',
            '09d': 'fa-cloud-showers-heavy',
            '09n': 'fa-cloud-showers-heavy',
            '10d': 'fa-cloud-sun-rain',
            '10n': 'fa-cloud-moon-rain',
            '11d': 'fa-bolt',
            '11n': 'fa-bolt',
            '13d': 'fa-snowflake',
            '13n': 'fa-snowflake',
            '50d': 'fa-smog',
            '50n': 'fa-smog'
        };
        
        iconElement.className = 'fas ' + iconMap[iconCode] || 'fa-sun';
    }
    
    // Function to show loading
    function showLoading() {
        loadingElement.style.display = 'flex';
    }
    
    // Function to hide loading
    function hideLoading() {
        loadingElement.style.display = 'none';
    }
    
    // Function to show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
    
    // Event listener for search input (autocomplete)
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();
        
        if (query.length >= 1) {
            debounceTimer = setTimeout(() => {
                getCitySuggestions(query);
            }, 300); // Debounce to avoid too many API calls
        } else {
            autocompleteDropdown.style.display = 'none';
        }
    });
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchContainer.contains(e.target)) {
            autocompleteDropdown.style.display = 'none';
        }
    });
    
    // Event listener for search button
    searchBtn.addEventListener('click', () => {
        const searchValue = searchInput.value.trim();
        if (searchValue) {
            city = searchValue;
            getWeatherData(city);
        }
    });
    
    // Event listener for Enter key
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            const searchValue = searchInput.value.trim();
            if (searchValue) {
                city = searchValue;
                getWeatherData(city);
            }
        }
    });
    
    // Initial weather data fetch
    getWeatherData(city);
});

// API Key Management
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const createKeyBtn = document.getElementById('create-key-btn');
    const apiKeyModal = document.getElementById('api-key-modal');
    const closeModal = document.querySelector('.close-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const saveKeyBtn = document.getElementById('save-key-btn');
    const modalTitle = document.getElementById('modal-title');
    const keyNameInput = document.getElementById('key-name');
    const generatedKeyGroup = document.getElementById('generated-key-group');
    const generatedKeyInput = document.getElementById('generated-key');
    const copyKeyBtn = document.getElementById('copy-key-btn');
    const apiKeysTbody = document.getElementById('api-keys-tbody');
    
    // API Keys Data
    let apiKeys = [
        { key: '451480c7101073812eeabfc84ea9d6a3', name: 'Default', status: 'active' },
        { key: '8f47401967df569bafe7e68c7f5ba155', name: 'weather', status: 'active' }
    ];
    
    let currentEditingKey = null;
    
    // Event Listeners
    createKeyBtn.addEventListener('click', openCreateModal);
    closeModal.addEventListener('click', closeApiModal);
    cancelBtn.addEventListener('click', closeApiModal);
    saveKeyBtn.addEventListener('click', saveApiKey);
    copyKeyBtn.addEventListener('click', copyGeneratedKey);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === apiKeyModal) {
            closeApiModal();
        }
    });
    
    // Functions
    function openCreateModal() {
        modalTitle.textContent = 'Create New API Key';
        keyNameInput.value = '';
        generatedKeyGroup.style.display = 'none';
        saveKeyBtn.textContent = 'Create Key';
        currentEditingKey = null;
        apiKeyModal.style.display = 'block';
        keyNameInput.focus();
    }
    
    function openEditModal(keyData) {
        modalTitle.textContent = 'Edit API Key';
        keyNameInput.value = keyData.name;
        generatedKeyGroup.style.display = 'none';
        saveKeyBtn.textContent = 'Save Changes';
        currentEditingKey = keyData;
        apiKeyModal.style.display = 'block';
        keyNameInput.focus();
    }
    
    function closeApiModal() {
        apiKeyModal.style.display = 'none';
        keyNameInput.value = '';
        generatedKeyGroup.style.display = 'none';
        currentEditingKey = null;
    }
    
    function generateApiKey() {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let key = '';
        for (let i = 0; i < 32; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    }
    
    function saveApiKey() {
        const name = keyNameInput.value.trim();
        
        if (!name) {
            alert('Please enter a key name');
            return;
        }
        
        if (currentEditingKey) {
            // Edit existing key
            currentEditingKey.name = name;
            renderApiKeys();
            closeApiModal();
            showNotification('API key updated successfully', 'success');
        } else {
            // Create new key
            const newKey = generateApiKey();
            generatedKeyInput.value = newKey;
            generatedKeyGroup.style.display = 'block';
            saveKeyBtn.style.display = 'none';
            
            // Add the new key to the list
            apiKeys.push({
                key: newKey,
                name: name,
                status: 'active'
            });
            
            renderApiKeys();
            showNotification('API key created successfully', 'success');
        }
    }
    
    function copyGeneratedKey() {
        generatedKeyInput.select();
        document.execCommand('copy');
        copyKeyBtn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            copyKeyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
        showNotification('API key copied to clipboard', 'success');
    }
    
    function toggleKeyStatus(keyData) {
        keyData.status = keyData.status === 'active' ? 'inactive' : 'active';
        renderApiKeys();
        showNotification(
            `API key ${keyData.status === 'active' ? 'activated' : 'deactivated'} successfully`,
            'success'
        );
    }
    
    function renderApiKeys() {
        apiKeysTbody.innerHTML = '';
        
        apiKeys.forEach(keyData => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td class="key-value">${keyData.key}</td>
                <td>${keyData.name}</td>
                <td><span class="status ${keyData.status}">${keyData.status === 'active' ? 'Active' : 'Inactive'}</span></td>
                <td class="actions">
                    <button class="action-btn edit-btn" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn ${keyData.status === 'active' ? 'deactivate-btn' : 'activate-btn'}" 
                            title="${keyData.status === 'active' ? 'Deactivate' : 'Activate'}">
                        <i class="fas fa-${keyData.status === 'active' ? 'ban' : 'check-circle'}"></i>
                    </button>
                </td>
            `;
            
            // Add event listeners
            const editBtn = row.querySelector('.edit-btn');
            const toggleBtn = row.querySelector('.deactivate-btn, .activate-btn');
            
            editBtn.addEventListener('click', () => openEditModal(keyData));
            toggleBtn.addEventListener('click', () => toggleKeyStatus(keyData));
            
            apiKeysTbody.appendChild(row);
        });
    }
    
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '15px 20px';
        notification.style.borderRadius = '8px';
        notification.style.color = 'white';
        notification.style.zIndex = '1001';
        notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        notification.style.animation = 'slideIn 0.3s ease';
        
        if (type === 'success') {
            notification.style.backgroundColor = '#28a745';
        } else if (type === 'error') {
            notification.style.backgroundColor = '#dc3545';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Initial render
    renderApiKeys();
});
