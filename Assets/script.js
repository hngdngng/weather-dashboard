var APIKey = "e6182f94e241fdadf1c2eb9e58710edc";

$(document).ready(function () {//once the HTML is loaded:
    $(".btn").on("click", citySearch); //call logUserInput function when save button is clicked
});

//Function to grab user city input
function citySearch(event) {
    event.preventDefault() // prevent page from refreshing when submitted
    var cityName = titleCase($(".city-input").val().trim()); //store user input as cityName in title case
    coordCall(cityName);
    updateHistory(cityName);
}

//Function to convert user city input to title case
function titleCase(str) {
    str = str.toLowerCase().split(' ');
    for (var i = 0; i < str.length; i++) {
        str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1); //capitalize first letter and joins with index [1] to end of string
    }
    return str.join(' ');
}

//Function to update search history
function updateHistory(cityName) {
    var li = $("<li class='list-group-item'>");
    li.text(cityName);
    $(".list-group").append(li);
}

//Function to get lat lon coordinates
function coordCall(cityName) {
    //Build URL we need to query the weather database
    var queryURL = "https://api.openweathermap.org/data/2.5/weather?q=" + cityName + "&appid=" + APIKey;

    //AJAX call
    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(function (response) {
        var lat = response.coord.lat;
        var lon = response.coord.lon;
        weatherCall(cityName, lat, lon)
    })
}

//Function to get weather data
function weatherCall(cityName, lat, lon) {
    //Build URL we need to query the weather database
    var queryURL = "https://api.openweathermap.org/data/2.5/onecall?lat=" + lat + "&lon=" + lon + "&exclude=hourly,minutely" + "&appid=" + APIKey;
    //AJAX call
    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(function (response) {
        var dateObject = new Date(response.current.dt * 1000);
        var dateConverted = dateObject.toDateString(); //Mon Jul 20 2020
        var tempF = Math.floor((response.current.temp - 273.15) * 1.80 + 32) + "\u00B0F"; //temp in degrees F
        var humidity = response.current.humidity + "%";
        var windSpeed = (response.current.wind_speed * 2.23694).toFixed(1) + "MPH"; //one decimal place
        var icon = response.current.weather[0].icon;
        var uvi = response.current.uvi;
        var cityForecast = new Array;
        var days = [1, 2, 3, 4, 5];

        days.forEach(day => {
            var foreDate = new Date(response.daily[day].dt * 1000);
            var foreConvert = foreDate.toDateString(); //Mon Jul 20 2020
            var foreTempF = Math.floor((response.daily[day].temp.day - 273.15) * 1.80 + 32) + "\u00B0F";
            var foreHum = response.daily[day].humidity + "%";
            var foreIcon = response.daily[day].weather[0].icon;
            var foreObject = {
                date: foreConvert,
                img: foreIcon,
                temp: foreTempF,
                hum: foreHum,
            }
            cityForecast.push(foreObject);
        })

        var cityObject = {
            name: cityName,
            date: dateConverted,
            temp: tempF,
            hum: humidity,
            wind: windSpeed,
            uv: uvi,
            img: icon,
            forecast: cityForecast,
        }
        localStorage.setItem(cityName, JSON.stringify(cityObject));
        renderWeatherToday(cityName);
        renderForecast(cityName);
    })
}

function renderWeatherToday(cityName) {
    var storedData = JSON.parse(localStorage.getItem(cityName));
    var currentCity = $("#city-today"); //target <div> for updating current city forecast
    var cityHeader = $("<h5>").text(storedData.name + " " + storedData.date + " ");
    var img = $("<img>")
    var imgUrl = "./Assets/images/" + storedData.img + ".png";
    img.attr("src", imgUrl);
    console.log(img);
    cityHeader.append(img);
    currentCity.append(cityHeader);
    currentCity.append($("<div>").text("Temperature: " + storedData.temp));
    currentCity.append($("<div>").text("Humidity: " + storedData.hum));
    currentCity.append($("<div>").text("Wind Speed: " + storedData.wind));
    currentCity.append($("<div>").text("UV Index: " + storedData.uv));
}

function renderForecast(cityName) {
    var storedData = JSON.parse(localStorage.getItem(cityName));
    var currentCity = $("#city-5day"); //target <div> for updating current city forecast
    currentCity.append($("<h5>").text("5-day Forecast"));
    var forecastRow = $("<div class='row'>");
    currentCity.append(forecastRow);

    storedData.forecast.forEach(function(day){
        var img = $("<img>");
        var imgUrl = "./Assets/images/" + day.img + ".png";
        img.attr("src", imgUrl);
        var dayCol = $("<div class='col forecastBox'>");
        dayCol.append($("<div>").text(day.date));
        dayCol.append(img);
        dayCol.append($("<div>").text("Temperature: " + day.temp));
        dayCol.append($("<div>").text("Humidity: " + day.hum));
        forecastRow.append(dayCol);
    });
}
