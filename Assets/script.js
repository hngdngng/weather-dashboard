var APIKey = "e6182f94e241fdadf1c2eb9e58710edc";
var citiesStored = localStorage.getItem("cities");
var cities = JSON.parse(citiesStored); //get cities array from local storage
if (!cities) { //if cities array is undefined
    cities = new Array(); //create a new empty array
}

$(document).ready(function () {//once the HTML is loaded:
    $(".btn").on("click", citySearch); //call citySearch function when save button is clicked
    var lastCity = localStorage.getItem("lastSearched"); //pull last city searched from local storage
    if (lastCity) { //if last city exists (previous search exists)
        lastCall(lastCity); // update the weather information displayed
    }
    $(".list-group-item").on("click", citySelect); //call citySelect function when city in search history list is clicked
});

//Function to grab user city input
function citySearch(event) {
    event.preventDefault(); // prevent page from refreshing when submitted
    var cityName = titleCase($(".city-input").val().trim()); //store user input as cityName in title case
    coordCall(cityName); //run function to get lat/lon data
}

//Function to convert user city input to title case
function titleCase(str) {
    str = str.toLowerCase().split(' ');
    for (var i = 0; i < str.length; i++) {
        str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1); //capitalize first letter and joins with index[1] to end of string
    }
    return str.join(' ');
}

//Function to update display if user clicks on a city in search history list
function citySelect(event) {
    event.preventDefault(); // prevent page from refreshing when clicked
    var cityName = event.target.textContent; //grab text content of the list element clicked
    lastCall(cityName); //call function to update display
}

//Function to update search history
function updateHistory() {
    $(".list-group").empty();
    cities.forEach(function (city) {
        var li = $("<li class='list-group-item'>");
        li.text(city);
        $(".list-group").append(li);
    })
    $(".list-group-item").on("click", citySelect); //re-assign click event to re-created list since it was emptied in line 42
}

//Function to update city weather displays for last item searched or clicked on
function lastCall(lastCity) {
    updateHistory();
    renderWeatherToday(lastCity);
    renderForecast(lastCity);
}

//Function to get lat lon coordinates
function coordCall(cityName) {
    //Build URL we need to query the weather database
    var queryURL = "https://api.openweathermap.org/data/2.5/weather?q=" + cityName + "&appid=" + APIKey;

    //AJAX call
    $.ajax({
        url: queryURL,
        method: "GET"
    }).done(function (response) { //if request is successful
        localStorage.setItem("lastSearched", cityName);
        cities.push(cityName); //update array of cities searched
        localStorage.setItem("cities", JSON.stringify(cities)); //update the array in local storage
        var lat = response.coord.lat; //latitude coord
        var lon = response.coord.lon; //longitude coord
        updateHistory();
        weatherCall(cityName, lat, lon)//grab weather information
    }).fail(function () {//if bad request or request fails
        alert("Invalid City") //alert invalid city
    })
}

//Function to get weather data from API
function weatherCall(cityName, lat, lon) {
    //Build URL we need to query the weather database
    var queryURL = "https://api.openweathermap.org/data/2.5/onecall?lat=" + lat + "&lon=" + lon + "&exclude=hourly,minutely" + "&appid=" + APIKey;
    //AJAX call
    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(function (response) {
        //grab current city weather values needed
        var dateObject = new Date(response.current.dt * 1000);
        var dateConverted = dateObject.toDateString(); //Mon Jul 20 2020
        var tempF = Math.floor((response.current.temp - 273.15) * 1.80 + 32) + "\u00B0F"; //temp in degrees F
        var humidity = response.current.humidity + "%";
        var windSpeed = (response.current.wind_speed * 2.23694).toFixed(1) + "MPH"; //one decimal place
        var icon = response.current.weather[0].icon;
        var uvi = response.current.uvi;

        var cityForecast = getForecast(response);//function to grab forecast data

        //create object for each city
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
        localStorage.setItem(cityName, JSON.stringify(cityObject));//store city object to local storage
        renderWeatherToday(cityName); //call function to update weather display
        renderForecast(cityName); //call function to update forecast display
    })
}

// grab forecasted city data
function getForecast(response) {

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
    return cityForecast;
}

//Function to update city's current weather
function renderWeatherToday(cityName) {
    //pull from local storage
    var storedData = JSON.parse(localStorage.getItem(cityName));
    var currentCity = $("#city-today"); //target <div> for updating current city forecast
    currentCity.empty(); //empty existing content
    var cityHeader = $("<h5>").text(storedData.name + " " + storedData.date + " ");
    var img = $("<img>")
    var imgUrl = "./Assets/images/" + storedData.img + ".png";
    img.attr("src", imgUrl);
    cityHeader.append(img);
    //append city date to page
    currentCity.append(cityHeader);
    currentCity.append($("<div>").text("Temperature: " + storedData.temp));
    currentCity.append($("<div>").text("Humidity: " + storedData.hum));
    currentCity.append($("<div>").text("Wind Speed: " + storedData.wind));
    currentCity.append($("<div>").html("UV Index: " + '<span class="indicator">' + storedData.uv + '</span>'));
    uvColor(storedData.uv); //call function to change UV color based on index
}

//Function to update city's forecasted weather
function renderForecast(cityName) {
    //pull from local storage
    var storedData = JSON.parse(localStorage.getItem(cityName));
    var currentCity = $("#city-5day"); //target <div> for updating current city forecast
    currentCity.empty(); //empty existing content
    currentCity.append($("<h5>").text("5-day Forecast"));
    var forecastRow = $("<div class='row forecast-row'>");
    currentCity.append(forecastRow);

    //append information to page for each forecast day
    storedData.forecast.forEach(function (day) {
        var img = $("<img>");
        var imgUrl = "./Assets/images/" + day.img + ".png";
        img.attr("src", imgUrl);
        var dayCol = $("<div class='col-sm forecastBox'>");
        dayCol.append($("<div>").text(day.date));
        dayCol.append(img);
        dayCol.append($("<div>").text("Temperature: " + day.temp));
        dayCol.append($("<div>").text("Humidity: " + day.hum));
        forecastRow.append(dayCol);
    });
}

//function to change UV index Low (1-2) Moderate (3-5) Severe (6+)
function uvColor(uvi) {
    if (uvi >= 6) {
        $(".indicator").css("background-color", "rgb(230,110,100)"); //red
    } else if (uvi >= 3 && uvi < 6) {
        $(".indicator").css("background-color", "rgb(236,175,89"); //orange
    } else {
        $(".indicator").css("background-color", "rgb(208,237,223"); //green
    }
}