// src/components/Weather.js
import React, { useState } from 'react';
import axios from 'axios';
import { Container, Typography, TextField, Button, Grid, Card, CardContent, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { 
  WiThermometer, 
  WiStrongWind, 
  WiHumidity, 
  WiBarometer,
  WiDaySunny, 
  WiNightClear, 
  WiDayCloudy, 
  WiNightAltCloudy, 
  WiCloud, 
  WiCloudy, 
  WiShowers, 
  WiRain, 
  WiThunderstorm, 
  WiSnow, 
  WiFog,
  WiDust
} from 'react-icons/wi';
import { motion } from 'framer-motion';
import API_KEY from '../config';
import './Weather.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const getWeatherIcon = (description, isDay = true) => {
  const lowerDesc = description.toLowerCase();
  
  switch (true) {
    case lowerDesc.includes('clear'):
      return isDay ? <WiDaySunny size={64} /> : <WiNightClear size={64} />;
    case lowerDesc.includes('few clouds'):
      return isDay ? <WiDayCloudy size={64} /> : <WiNightAltCloudy size={64} />;
    case lowerDesc.includes('scattered clouds'):
      return <WiCloud size={64} />;
    case lowerDesc.includes('broken clouds') || lowerDesc.includes('overcast'):
      return <WiCloudy size={64} />;
    case lowerDesc.includes('shower') || lowerDesc.includes('drizzle'):
      return <WiShowers size={64} />;
    case lowerDesc.includes('rain'):
      return <WiRain size={64} />;
    case lowerDesc.includes('thunderstorm'):
      return <WiThunderstorm size={64} />;
    case lowerDesc.includes('snow') || lowerDesc.includes('sleet'):
      return <WiSnow size={64} />;
    case lowerDesc.includes('mist') || lowerDesc.includes('fog'):
      return <WiFog size={64} />;
    case lowerDesc.includes('dust') || lowerDesc.includes('sand'):
      return <WiDust size={64} />;
    default:
      return <WiDaySunny size={64} />; // default to sunny icon
  }
};

const isDay = (current, sunrise, sunset) => {
  return current > sunrise && current < sunset;
};

function Weather() {
  const [city, setCity] = useState('');
  const [cities, setCities] = useState([]);
  const [weatherData, setWeatherData] = useState({});

  const handleInputChange = (e) => {
    setCity(e.target.value);
  };

  const fetchWeather = async (cityName) => {
    try {
      const weatherResponse = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`);
      const forecastResponse = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${API_KEY}&units=metric`);

      setWeatherData((prevData) => ({
        ...prevData,
        [cityName]: {
          current: weatherResponse.data,
          forecast: forecastResponse.data.list.map(item => ({
            date: new Date(item.dt * 1000),
            temp: item.main.temp,
            feels_like: item.main.feels_like,
            humidity: item.main.humidity,
            wind_speed: item.wind.speed,
            description: item.weather[0].description,
            icon: item.weather[0].icon,
          })),
        },
      }));
    } catch (error) {
      console.error('Error fetching the weather data', error);
    }
  };

  const handleAddCity = () => {
    if (city && !cities.includes(city)) {
      setCities([...cities, city]);
      fetchWeather(city);
      setCity('');
    }
  };

  const handleDeleteCity = (cityName) => {
    setCities(cities.filter((c) => c !== cityName));
    setWeatherData((prevData) => {
      const { [cityName]: _, ...rest } = prevData;
      return rest;
    });
  };

  const generateChartData = (forecast) => {
    const data = {
      labels: forecast.map(item => item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
      datasets: [
        {
          label: 'Temperature (°C)',
          data: forecast.map(item => item.temp),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          yAxisID: 'y-axis-1',
        },
        {
          label: 'Humidity (%)',
          data: forecast.map(item => item.humidity),
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          yAxisID: 'y-axis-2',
        },
        {
          label: 'Wind Speed (m/s)',
          data: forecast.map(item => item.wind_speed),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          yAxisID: 'y-axis-3',
        },
      ]
    };

    return data;
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    stacked: false,
    plugins: {
      title: {
        display: true,
        text: '5-Day Weather Forecast',
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        id: 'y-axis-1',
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        id: 'y-axis-2',
        grid: {
          drawOnChartArea: false,
        },
      },
      y2: {
        type: 'linear',
        display: true,
        position: 'right',
        id: 'y-axis-3',
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const renderForecastCards = (cityName) => {
    if (!weatherData[cityName] || !weatherData[cityName].forecast) {
      return null;
    }

    const forecast = weatherData[cityName].forecast;
    const groupedForecast = forecast.reduce((acc, item) => {
      const date = item.date.toLocaleDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    }, {});

    return Object.entries(groupedForecast).map(([date, items]) => (
      <Card key={date} className="forecast-card">
        <CardContent>
          <Typography variant="h6">{new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</Typography>
          <div className="forecast-details">
            {items.map((item, index) => (
              <div key={index} className="forecast-item">
                <Typography variant="body2">{item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                {getWeatherIcon(item.description, isDay(item.date.getTime() / 1000, weatherData[cityName].current.sys.sunrise, weatherData[cityName].current.sys.sunset))}
                <Typography variant="body1">{Math.round(item.temp)}°C</Typography>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ));
  };

  return (
    <Container className="weather-container" maxWidth={false} disableGutters>
      <div className="content-wrapper">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h3" component="h1" gutterBottom align="center" className="dashboard-title">
            Weather Dashboard
          </Typography>
        </motion.div>
        
        <Grid container spacing={2} alignItems="center" className="search-container">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Search for a city"
              variant="outlined"
              value={city}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleAddCity}
              className="add-city-button"
            >
              Add City
            </Button>
          </Grid>
        </Grid>

        <Grid container spacing={3} className="city-list">
          {cities.map((cityName) => (
            <Grid item xs={12} key={cityName}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="city-card">
                  <CardContent>
                    <Grid container justifyContent="space-between" alignItems="center">
                      <Typography variant="h6">{cityName}</Typography>
                      <IconButton onClick={() => handleDeleteCity(cityName)}>
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                    
                    {weatherData[cityName] && weatherData[cityName].current && (
                      <div className="weather-info">
                        <Typography variant="h4" component="h2" gutterBottom>
                          {weatherData[cityName].current.name}, {weatherData[cityName].current.sys.country}
                        </Typography>
                        <div className="current-weather">
                          {getWeatherIcon(
                            weatherData[cityName].current.weather[0].description,
                            isDay(
                              weatherData[cityName].current.dt,
                              weatherData[cityName].current.sys.sunrise,
                              weatherData[cityName].current.sys.sunset
                            )
                          )}
                          <Typography variant="h2">
                            {Math.round(weatherData[cityName].current.main.temp)}°C
                          </Typography>
                          <Typography variant="h6">
                            {weatherData[cityName].current.weather[0].description}
                          </Typography>
                        </div>
                        <Grid container spacing={2} className="weather-details">
                          <Grid item xs={6} sm={3}>
                            <div className="weather-detail-item">
                              <WiThermometer size={24} />
                              <Typography variant="body1">Feels like: {Math.round(weatherData[cityName].current.main.feels_like)}°C</Typography>
                            </div>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <div className="weather-detail-item">
                              <WiHumidity size={24} />
                              <Typography variant="body1">Humidity: {weatherData[cityName].current.main.humidity}%</Typography>
                            </div>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <div className="weather-detail-item">
                              <WiStrongWind size={24} />
                              <Typography variant="body1">Wind: {weatherData[cityName].current.wind.speed} m/s</Typography>
                            </div>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <div className="weather-detail-item">
                              <WiBarometer size={24} />
                              <Typography variant="body1">Pressure: {weatherData[cityName].current.main.pressure} hPa</Typography>
                            </div>
                          </Grid>
                        </Grid>
                        
                        <Typography variant="h5" component="h3" gutterBottom className="forecast-title">
                          5-Day Forecast
                        </Typography>
                        <div className="forecast-container">
                          {renderForecastCards(cityName)}
                        </div>
                        {weatherData[cityName].forecast && (
                          <div className="forecast-chart">
                            <Line data={generateChartData(weatherData[cityName].forecast)} options={chartOptions} />
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </div>
    </Container>
  );
}

export default Weather;