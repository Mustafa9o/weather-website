document.addEventListener('DOMContentLoaded', () => {
    // Replace with your OpenWeatherMap API key
    const apiKey = '8f47401967df569bafe7e68c7f5ba155'; // IMPORTANT: Replace with your actual API key
    
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
    
    // Check if API key is set
    if (apiKey === 'YOUR_API_KEY_HERE') {
        showError('Please set your OpenWeatherMap API key in script.js');
        return;
    }
    
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
