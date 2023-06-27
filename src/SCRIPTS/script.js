'use strict';

import imgs from './imgs';
import * as L from 'leaflet';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const sidebar = document.querySelector('.sidebar');

class Workout {
  id = this._idMaker().slice(-9);

  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }

  _idMaker() {
    const date = new Date();
    this.date = date;
    return `${Date.now()}`;
  }
  _createContent() {
    return `${this.icon} ${this.typeString} on ${this._createDate()}`;
  }

  _createDate() {
    const datefromation = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
    }).format(this.date);

    return datefromation;
  }
}

class Running extends Workout {
  constructor(distance, duration, coords, cadance) {
    super(distance, duration, coords);
    this.cadance = cadance;
    this._calPace();
    this.type = 'running';
    this.typeString = 'Running';
    this.icon = '🏃';
  }

  _calPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  constructor(distance, duration, coords, elvgain) {
    super(distance, duration, coords);
    this.elvgain = elvgain;
    this._calSpeed();
    this.type = 'cycling';
    this.typeString = 'Cycling';
    this.icon = '🚴';
  }

  _calSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

/////////////
////App//////

class App {
  #WorkoutList = [];
  #map;
  #mapE;
  constructor() {
    this._getPosiion();

    document.addEventListener('click', this._submitForm.bind(this));

    inputType.addEventListener('change', this._toggleElevationField);

    form.addEventListener('submit', this._newWorkOut.bind(this));

    containerWorkouts.addEventListener('click', this._moveMap.bind(this));

    sidebar.addEventListener('click', (x) => {
      if (x.target.closest('form') == form) return;
      form.classList.add('hidden');
    });
  }

  _getPosiion() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (x) => {
          const { latitude, longitude } = x.coords;
          this._cordinates = [latitude, longitude];
          this._loadMap(this._cordinates);
        },
        function () {
          alert(`couldn't find the location`);
        },
      );
    }
  }

  _loadMap(coords) {
    this.#map = L.map('map').setView(this._cordinates, 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._openfrom.bind(this));
    this._getFromStorage();
    document.addEventListener('click', this._revealFrom.bind(this));
    document.addEventListener('click', this._removeWorkout.bind(this));
  }
  _removeWorkout(x) {
    if (!x.target.classList.contains('remove')) return;
    const Id = x.target.closest('.workout').dataset.id;

    const obj = this.#WorkoutList.find((workout) => workout.id === Id);
    const objindex = this.#WorkoutList.findIndex(
      (workout) => workout.id === Id,
    );
    this.#WorkoutList.splice(objindex, 1);

    console.log(objindex);

    console.log(this.#WorkoutList);

    this._saveToStorage(this.#WorkoutList);

    const parentElement = document.querySelector('.workouts');

    const childElements = parentElement.children;

    for (let i = childElements.length - 1; i > 0; i--) {
      parentElement.removeChild(childElements[i]);
    }
    this.#WorkoutList = [];

    this._removeWorkoutMarkers();
    this._getFromStorage();
  }
  _openfrom(mapE) {
    this._hideAllEdform();
    document.removeEventListener('change', this._toggleElevationFieldEdit);
    this.#mapE = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
    document.addEventListener('change', this._toggleElevationFieldEdit);
  }

  _toggleElevationField(e) {
    if (!e.target.matches('.form__input--type')) return;
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _toggleElevationFieldEdit(select) {
    if (!select.target.matches('.edit-select')) return;
    const element = select.target.closest('.Edfrom');
    const inputCadence = element.querySelector('.form__input--cadence');
    const inputElevation = element.querySelector('.form__input--elevation');

    inputCadence
      .closest('.edited__from__row')
      .classList.toggle('edited__from__row-hidden');
    inputElevation
      .closest('.edited__from__row')
      .classList.toggle('edited__from__row-hidden');

    const workoutContainer = element.closest('.workout');
    workoutContainer.classList.toggle('workout--running');
    workoutContainer.classList.toggle('workout--cycling');
  }

  _newWorkOut(e) {
    e.preventDefault();

    document.removeEventListener('change', this._toggleElevationFieldEdit);
    let { lat, lng } = this.#mapE.latlng;

    const distance = inputDistance.value;
    const duration = inputDuration.value;
    const coords = [lat, lng];
    const type = inputType.value;

    let workout;

    if (inputType.value === 'running') {
      const cadence = inputCadence.value;
      if (
        !this._validInput(distance, duration, cadence) ||
        !this._allPositive(distance, duration, cadence)
      )
        return alert('please enter right input');
      workout = new Running(distance, duration, coords, cadence);
      this.#WorkoutList.push(workout);
    }
    if (inputType.value === 'cycling') {
      const elevation = inputElevation.value;
      if (
        !this._validInput(distance, duration, elevation) ||
        !this._allPositive(distance, duration)
      )
        return alert('please enter right input');
      workout = new Cycling(distance, duration, coords, elevation);
      this.#WorkoutList.push(workout);
    }
    this._renderWorkoutMarker(workout);
    this._renderWorkoutlist(workout);
    this._hideform();

    document.addEventListener('change', this._toggleElevationFieldEdit);

    this._saveToStorage(this.#WorkoutList);
  }
  _hideform() {
    form.style.display = 'none';
    form.classList.add('hidden');
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    setTimeout(function () {
      form.style.display = 'grid';
    }, 1000);
  }

  _validInput(...values) {
    return values.every((val) => {
      return Number.isFinite(Number(val));
    });
  }

  _allPositive(...values) {
    return values.every((val) => {
      return Number(val) > 0;
    });
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          closeButton: false,
          autoClose: false,
          closeOnClick: false,
          content: `${workout._createContent()}`,
          className: `${workout.type}-popup`,
        }),
      )
      .openPopup();
  }

  _removeWorkoutMarkers() {
    const leafletPopUpPane = document.querySelector('.leaflet-popup-pane');
    const popups = document.querySelectorAll('.leaflet-popup');
    const leafletMarkerPane = document.querySelector('.leaflet-marker-pane');
    const markers = document.querySelectorAll('.leaflet-marker-icon');
    const leafletShadowpane = document.querySelector('.leaflet-shadow-pane');
    const shadows = document.querySelectorAll('.leaflet-marker-shadow');
    popups.forEach((popup) => {
      leafletPopUpPane.removeChild(popup);
    });

    markers.forEach((marker) => {
      leafletMarkerPane.removeChild(marker);
    });

    shadows.forEach((shadow) => {
      leafletShadowpane.removeChild(shadow);
    });
  }

  _renderWorkoutlist(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <div class="top-icons"> 
    <img class="edit" src="${imgs.editIcon}" alt="" srcset="">  
    <img class="remove" src="${imgs.closeIcon}" alt="" srcset="">  
    </div>
    

      <h2 class="workout__title">${
        workout.typeString
      } on ${workout._createDate()}</h2>
      <div class="workout__details distance">
        <span class="workout__icon">${workout.icon}</span>
        <span class="workout__value distance-value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details duration">
        <span class="workout__icon">⏱</span>
        <span class="workout__value duration-value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
  `;

    let option, cadanceOrElv;
    if (workout.type === 'running') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value pace-value">${workout.pace.toFixed(
          1,
        )}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value cadance-value">${workout.cadance}</span>
        <span class="workout__unit">spm</span>
      </div>
    `;

      option = `<option value="running" selected>🏃</option>
                <option value="cycling" >🚴</option>`;

      cadanceOrElv = `<div class="edited__from__row ">
                <label class="form__label">Cadence</label>
                <input
                  class="form__input form__input--cadence"
                  placeholder="step/min"
                />
              </div>
              <div class="edited__from__row edited__from__row-hidden">
                <label class="form__label">ElevGain</label>
                <input
                  class="form__input form__input--elevation"
                  placeholder="meters"
                />
              </div>

      `;
    }

    if (workout.type === 'cycling') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value speed-value">${workout.speed.toFixed(
          1,
        )}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value elvgain-value">${workout.elvgain}</span>
        <span class="workout__unit">m</span>
      </div>

      
    `;
      option = `<option value="running">🏃</option>
                <option value="cycling" selected>🚴</option>`;

      cadanceOrElv = `<div class="edited__from__row edited__from__row-hidden">
                <label class="form__label">Cadence</label>
                <input
                  class="form__input form__input--cadence"
                  placeholder="step/min"
                />
              </div>
              <div class="edited__from__row ">
                <label class="form__label">Elev Gain</label>
                <input
                  class="form__input form__input--elevation"
                  placeholder="meters"
                />
              </div>

      `;
    }

    html += `<div class="hiddenn Edfrom">
            <form class="edit__from">
              <select class="edit-select">
                ${option}
              </select>
              <div class="edited__from__row">
                <label class="form__label">Distance</label>
                <input class="form__input form__input--distance" placeholder="km" />
              </div>
              <div class="edited__from__row">
                <label class="form__label">Duration</label>
                <input class=" form__input form__input--duration" placeholder="min" />
              </div>
               ${cadanceOrElv}

               <div class="buttom-icons"> 
                     <img class="save" src="${imgs.correctIcon}" alt="" srcset="">  
               </div>
            </form>
          </div></li>`;

    form.insertAdjacentHTML('afterend', html);

    this._setDatasToEdFrom();
  }

  _revealFrom(x) {
    if (x.target.classList.contains('edit')) {
      const parent = x.target.closest('.workout');
      parent.querySelector('.Edfrom').classList.remove('hiddenn');
      parent.querySelectorAll('.workout__details').forEach((x) => {
        x.classList.add('hiddenn');
      });
    }
  }

  _hideEdform(x) {
    const parent = x.target.closest('.workout');
    parent.querySelector('.Edfrom').classList.add('hiddenn');
    parent.querySelectorAll('.workout__details').forEach((x) => {
      x.classList.remove('hiddenn');
    });
  }

  _hideAllEdform() {
    document.querySelectorAll('.workout').forEach((x) => {
      x.querySelector('.Edfrom').classList.add('hiddenn');
      x.querySelectorAll('.workout__details').forEach((y) => {
        y.classList.remove('hiddenn');
      });
    });
  }

  _setDatasToEdFrom() {
    const forms = document.querySelectorAll('.Edfrom');

    forms.forEach((x) => {
      const workout = x.closest('.workout');
      let workoutObj = this.#WorkoutList.find(
        (x) => x.id === workout.dataset.id,
      );

      let distance = x.querySelector('.form__input--distance');
      let duration = x.querySelector('.form__input--duration');
      let cadence = x.querySelector('.form__input--cadence');
      let elevation = x.querySelector('.form__input--elevation');

      distance.value = workoutObj.distance;
      duration.value = workoutObj.duration;

      cadence.value = workoutObj.cadance || '';
      elevation.value = workoutObj.elvgain || '';
    });
  }

  _submitForm(x) {
    if (!x.target.classList.contains('save')) return;

    const edFrom = x.target.closest('.Edfrom');
    const workout = edFrom.closest('.workout');
    const select = x.target.closest('.workout').querySelector('.edit-select');
    let workoutObj = this.#WorkoutList.find((x) => x.id === workout.dataset.id);

    const workoutDistance = workout.querySelector('.distance-value');
    const workoutDuration = workout.querySelector('.duration-value');
    const workoutCadence = workout.querySelector('.cadance-value');
    const workoutElevation = workout.querySelector('.elvgain-value');
    const pace = workout.querySelector('.pace-value');
    const speed = workout.querySelector('.speed-value');

    const isrunning = workoutObj.type === 'running';
    const iscycling = workoutObj.type === 'cycling';

    let distance = edFrom.querySelector('.form__input--distance');
    let duration = edFrom.querySelector('.form__input--duration');
    let cadence = edFrom.querySelector('.form__input--cadence');
    let elevation = edFrom.querySelector('.form__input--elevation');

    if (select.value === workoutObj.type) {
      workoutObj.distance = workoutDistance.innerText = Number(distance.value);
      workoutObj.duration = workoutDuration.innerText = Number(duration.value);

      if (isrunning) {
        workoutObj.cadance = workoutCadence.innerText =
          Number(cadence.value) || '';
        pace.innerText = workoutObj._calPace().toFixed(2);
      } else if (iscycling) {
        workoutObj.elvgain = workoutElevation.innerText =
          Number(elevation.value) || '';
        speed.innerText = workoutObj._calSpeed().toFixed(2);
      }

      this._saveToStorage(this.#WorkoutList);
    } else {
      this._changeTheObj(select, distance, duration, cadence, elevation);
    }

    this._hideEdform(x);
  }

  _changeTheObj(select, distance, duration, cadence, elevation) {
    const workout = select.closest('.workout');
    const workoutId = workout.dataset.id;

    const workObj = this.#WorkoutList.find((workout) => {
      return workout.id === workoutId;
    });

    const index = this.#WorkoutList.findIndex(
      (workout) => Number(workout.id) === Number(workoutId),
    );
    if (select.value === 'cycling') {
      const changeToCyclig = new Cycling(
        distance.value,
        duration.value,
        workObj.coords,
        elevation.value,
      );
      changeToCyclig.id = workObj.id;
      changeToCyclig.date = workObj.date;
      this.#WorkoutList[index] = changeToCyclig;
    }

    if (select.value === 'running') {
      const changeToRunning = new Running(
        distance.value,
        duration.value,
        workObj.coords,
        cadence.value,
      );

      changeToRunning.id = workObj.id;
      changeToRunning.date = workObj.date;
      this.#WorkoutList[index] = changeToRunning;
    }

    this._saveToStorage(this.#WorkoutList);

    const parentElement = document.querySelector('.workouts');

    const childElements = parentElement.children;

    for (let i = childElements.length - 1; i > 0; i--) {
      parentElement.removeChild(childElements[i]);
    }
    this.#WorkoutList = [];

    this._removeWorkoutMarkers();
    this._getFromStorage();
  }

  _moveMap(event) {
    const workoutEl = event.target.closest('.workout');
    if (!workoutEl) return;
    const data = workoutEl.dataset.id;
    const obj = this.#WorkoutList.find((obj) => obj.id === data);
    this.#map.setView(obj.coords, 15, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _saveToStorage(arr) {
    if (arr.length < 0) return;
    const dataString = JSON.stringify(arr) || '';
    localStorage.setItem('Workoutlists', dataString);
  }

  _getFromStorage() {
    let datas = JSON.parse(localStorage.getItem('Workoutlists'));
    if (datas == undefined) return;

    // this.#WorkoutList = [];
    datas.forEach((data) => {
      let obj;
      if (data.type === 'running') {
        obj = new Running(
          data.distance,
          data.duration,
          data.coords,
          data.cadance,
        );

        obj.date = new Date(data.date);
        obj.id = data.id;

        this.#WorkoutList.push(obj);
      }

      if (data.type === 'cycling') {
        obj = new Cycling(
          data.distance,
          data.duration,
          data.coords,
          data.elvgain,
        );

        obj.date = new Date(data.date);
        obj.id = data.id;

        this.#WorkoutList.push(obj);
      }
      this._renderWorkoutMarker(obj);
      this._renderWorkoutlist(obj);
    });
    document.addEventListener('change', this._toggleElevationFieldEdit);
  }
}

// let userAgent = navigator.userAgent;
// if (userAgent.match(/edg/i)) {
//   alert(
//     'Edge browser currently having a bug with the geolocation API, please use another browser, Thank You!'
//   );
// } else {
//   const myApp = new App();
// }
const myApp = new App();
