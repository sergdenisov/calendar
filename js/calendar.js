// Событие
// ------------------------------------------------------------------------------------------------
// Свойства
Event_.prototype.name;
Event_.prototype.date;
Event_.prototype.participants;
Event_.prototype.description;

// Конструктор
function Event_(name, date, participants, description) {
  this.name = name;
  this.date = new Date(Date.parse(date));
  this.participants = participants;
  this.description = description;
}
// ------------------------------------------------------------------------------------------------

// Общие переменные для страницы
var now = new Date(),
	today = new Date(now.getFullYear(), now.getMonth(), now.getDate()),
	firstLoadCalendar = true,
	daysList,
	eventsList = [];
	
window.onbeforeunload = unloadPage;

// Загрузка страницы
function loadPage() {
	// jQuery-плагин для отображения placeholder в IE 9
	$('input, textarea').placeholder();
	// Загрузим данные
	loadDataFromLocalStorage();
	// Загрузка календаря
	loadCalendar(today, true);
}
  
// Выгрузка страницы
function unloadPage() {
	// Сохраним данные
	saveDataToLocalStorage();
}

// Загрузка календаря
function loadCalendar(date, isPossibleToChangeSelected) {
	var currentDate = getNearestSundayDateForMonthEnd(getMonthLastDate(date)),
		tr,
		td,
		data,
		currentMonthDate,
		isNeedChangeSelected = false,
		eventID,
		eventInfo;
		
	closeAddEventPopup();
	// Если первое прочтение, создадим таблицу календаря
	if (firstLoadCalendar) {
		createCalendarTable();
		isNeedChangeSelected = isPossibleToChangeSelected;
	}
	// Меняем месяц
	daysList = document.querySelectorAll('.day_name');
	currentMonthDate = document.querySelector('#first_month_day');
	// Если необходимо, изменяем выделенный элемент
	if ((Date.parse(currentMonthDate.value) - date) != 0) {
		isNeedChangeSelected = isPossibleToChangeSelected;
	}
	currentMonthDate.value = date;
	// Название текущего месяца
	document.querySelector('#month_name').innerHTML = getMonthName(date) + ' ' + date.getFullYear();

	// Заполнение календаря
	for (var i = daysList.length - 1; i >= 0; i--) {
		data = daysList[i].parentNode.parentNode;
		td = data.parentNode;
		tr = td.parentNode;
		
		data.onclick = setSelectedDayOnClick;
		// Первую строку в календаре помечаем
		if (tr.className == 'first_row') {
			daysList[i].innerHTML = '<span>' + getWeekDayName(currentDate) + ', ' + currentDate.getDate() + '</span>';
		} else {
			daysList[i].innerHTML = '<span>' + currentDate.getDate() + '</span>';
		}
		// Событие
		eventID = findEventByDate(currentDate);
		if (eventID != -1) {
			if (!data.className.match(/\bhas_event\b/)) {
				data.className += ' has_event';
			}
			eventInfo = '<span>' + eventsList[eventID].name + '</span>';
			if (eventsList[eventID].participants != null) {
				eventInfo += '<span>' + eventsList[eventID].participants + '</span>';
			}
			daysList[i].innerHTML += eventInfo;
		} else {
			data.className = data.className.replace(/\b has_event\b/, '');
		}
		// Сегодня
		if ((currentDate - today) == 0) {
			if (!data.className.match(/\btoday\b/)) {
				data.className += ' today';
			}
			if (isPossibleToChangeSelected) {
				setSelectedDay(data, false);
				isNeedChangeSelected = false;
			}
		} else {
			data.className = data.className.replace(/\b today\b/,'');
		}
		// Установим значение в ячейку и сменим выбранный день
		daysList[i].previousSibling.value = currentDate;
		if (isNeedChangeSelected && (Date.parse(currentMonthDate.value) - currentDate) == 0) {
			setSelectedDay(data, false);
		}
		currentDate.setDate(currentDate.getDate() - 1);
	}
}

// Создание таблицы календаря
function createCalendarTable() {
	var table = document.querySelector('#table_calendar>tbody'),
		tr,
		td,
		data,
		day,
		day_name,
		day_id;
		
	for (var i = 0; i < 6; i++) {
		tr = document.createElement('tr');
		if (i == 0) { 
			tr.className = 'first_row';
		}
		table.appendChild(tr);
		
		for (var j = 0; j < 7; j++) {
			td = document.createElement('td');
			tr.appendChild(td);
			data = document.createElement('div');
			data.className = 'data';
			td.appendChild(data);
			day = document.createElement('div');
			day.className = 'day';
			data.appendChild(day);
			day_id = document.createElement('input');
			day_id.type = 'hidden';
			day_id.className = 'day_id';
			day.appendChild(day_id);
			day_name = document.createElement('div');
			day_name.className = 'day_name';
			day.appendChild(day_name);
		}	
	}
	firstLoadCalendar = false;
}

// Поиск события по дате
function findEventByDate(date) {
	for (var i = 0; i < eventsList.length; i++) {
		if ((eventsList[i].date - date) == 0) {
			return i;
		}
	}
	return -1;
}

// Заполнение данными всплывающего окна добавления события
function fillDataToAddEventPopup(data) {
	var day = data.getElementsByClassName('day')[0],
		dayID = day.getElementsByClassName('day_id')[0],
		date = new Date(Date.parse(dayID.value)),
		i = findEventByDate(date),
		inputName = document.getElementById('input_add_event_name'),
		inputDate = document.getElementById('input_add_event_date'),
		inputParticipants = document.getElementById('input_add_event_participants'),
		inputDescription = document.getElementById('input_add_event_description');

	if (i != - 1) {
		inputName.value = eventsList[i].name;
		inputName.setAttribute('disabled', 'disabled');
		inputDate.value = date.getDate() + ' ' + getMonthNameInGenitive(date).toLowerCase();
		inputDate.setAttribute('disabled', 'disabled');
		inputParticipants.value = eventsList[i].participants;
		if (eventsList[i].participants != null) {
			inputParticipants.setAttribute('disabled', 'disabled');
		}
		inputDescription.value = eventsList[i].description;
		if (eventsList[i].description != null) {
			inputDescription.setAttribute('disabled', 'disabled');
		}
	} else {
		$('#input_add_event_name').val('');
		inputName.removeAttribute('disabled');
		$('#input_add_event_date').val('');
		inputDate.removeAttribute('disabled');
		$('#input_add_event_participants').val('');
		inputParticipants.removeAttribute('disabled');
		$('#input_add_event_description').val('');
		inputDescription.removeAttribute('disabled');
	}
}

// Сортировка списка событий
function sortEventsList() {
	function compareByDates(a, b) {
	  if (a.date > b.date) return 1;
	  if (a.date < b.date) return -1;
	}
	eventsList.sort(compareByDates);
}

// Функция, возвращающая последний день месяца
function getMonthLastDate(date) {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

// Функция, возвращающая день последнего воскресенья месяца
function getNearestSundayDateForMonthEnd(date) {
	var monthLastDay = date.getDay(),
		difference = (monthLastDay != 6) ? 6 - monthLastDay : 0;
	return new Date(date.getFullYear(), date.getMonth(), date.getDate() + difference + 1);
}

// Функция, возвращающая наименование дня недели в русском варианте
function getWeekDayName(date) {
	var days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
	return days[date.getDay()];
}

// Обработчик события клика по ячейке таблицы
function setSelectedDayOnClick() {
	setSelectedDay(this, true);
}

// Функция, устанавливающая выбранный день по элементу данных (с возможностью вызова всплывающего окна с подробностями)
function setSelectedDay(thisData, isNeedPopUp) {
	var data,
		popup,
		isMatched = thisData.className.match(/\bselected\b/);
		
	if (!isMatched) {
		thisData.className += ' selected';
		// Для нормального отображения в Firefox
		if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
			thisData.parentNode.style = 'display: block;';
		}
	}
	for (var i = 0; i < daysList.length; i++) {
		data = daysList[i].parentNode.parentNode;
		if (thisData != data) {
			data.className = data.className.replace(/\b selected\b/,'');
			if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
				data.parentNode.style = '';
			}
		}
	}
	if (isNeedPopUp) {
		popup = document.getElementById('popup_add_event');
		if (popup.style.display == 'block') {
			if (isMatched) {
				closeAddEventPopup();
			}
		} else {
			popup.style.display = 'block';
			closeQuickAddEventPopup();
		}
		if (popup.style.display == 'block') {
			fillDataToAddEventPopup(thisData);
			thisData.parentNode.appendChild(popup);
		}
	}
};

// Функция, устанавливающая выбранный день по дате (с возможностью вызова всплывающего окна с подробностями)
function setSelectedDayByDate(thisDate, isNeedPopUp) {
	var data,
		date;
	for (var i = 0; i < daysList.length; i++) {
		date = Date.parse(daysList[i].previousSibling.value);
		data = daysList[i].parentNode.parentNode;
		if (date - Date.parse(thisDate) == 0) {
			if (!data.className.match(/\bselected\b/)) {
				data.className += ' selected';
			}			
		} else {
			data.className = data.className.replace(/\b selected\b/,'');
		}
	}
};

// Функция, изменяющая выбранный месяц в календаре
function changeMonth(difference) {
	var date = new Date(Date.parse(document.querySelector('#first_month_day').value));
	loadCalendar(new Date(date.getFullYear(), date.getMonth() + difference, 1), true);
}

// Функция, возвращающая наименование месяца в русском варианте
function getMonthName(date) {
	var days = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
	return days[date.getMonth()];
}

// Функция, возвращающая наименование месяца в русском варианте (в род. падеже)
function getMonthNameInGenitive(date) {
	var days = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'];
	return days[date.getMonth()];
}

// Открыть всплывающее окно быстрого добавления события
function openQuickAddEventPopup() {
    document.getElementById('popup_quick_add_event').style.display = 'block';
	closeAddEventPopup();
}

// Закрыть всплывающее окно быстрого добавления события
function closeQuickAddEventPopup() {
    document.getElementById('popup_quick_add_event').style.display = 'none';
	$('#input_quick_add_event').val('');
}

// Закрыть всплывающее окно добавления события
function closeAddEventPopup() {
    document.getElementById('popup_add_event').style.display = 'none';
	$('#input_add_event_name').val('');
	$('#input_add_event_date').val('');
	$('#input_add_event_participants').val('');
	$('#input_add_event_description').val('');
}

// Удалить событие по его номеру в списке
function deleteEvent(i) {
	eventsList.splice(i, 1);
}

// Быстро добавить событие
function quickAddEvent(eventInfo) {
	var arr = eventInfo.split(','),
		date,
		name,
		description = null,
		event_,
		i;

		date = getDateFromString(arr[0]);
		if (date == null || arr[1] == null) {
			alert('Введенные данные некорректны, повторите ввод.');
			return;
		}
		name = arr[1].replace(/(^\s+|\s+$)/g, '');
		if (arr.length > 2) {
			description = arr[2].replace(/(^\s+|\s+$)/g, '');
		}
		i = findEventByDate(date);
		if (i != -1) {
			if (confirm('На заданную дату уже создано событие (' + eventsList[i].name + '), заменить его?')) {
				deleteEvent(i);
				i = -1;
			}		
		}
		if (i == -1) {
			event_ = new Event_(name, date, null, description);
			eventsList.push(event_);
			sortEventsList();
			closeQuickAddEventPopup();
		}
		if (i == -1 || confirm('Перейти к уже существующему событию?')) { 	
			loadCalendar(new Date(date.getFullYear(), date.getMonth(), 1), false);
			setSelectedDayByDate(date, false);
		}
}

// Добавить или отредактировать событие
function addOrEditEvent() {
	var selected = document.getElementsByClassName('selected')[0],
		isHasEvent = selected.className.match(/\bhas_event\b/),
		day = selected.getElementsByClassName('day')[0],
		dayID = day.getElementsByClassName('day_id')[0],
		date = new Date(Date.parse(dayID.value)),
		i = findEventByDate(date),
		eventNameValue = document.getElementById('input_add_event_name').value.replace(/(^\s+|\s+$)/g, ''),
		eventDateValue = getDateFromString(document.getElementById('input_add_event_date').value),
		eventParticipants = document.getElementById('input_add_event_participants'),
		eventParticipantsValue = eventParticipants.value.replace(/(^\s+|\s+$)/g, ''),
		eventDescription = document.getElementById('input_add_event_description'),
		eventDescriptionValue = eventDescription.value.replace(/(^\s+|\s+$)/g, '');
	
	if (!isHasEvent && (eventDateValue == null || eventNameValue == null)) {
		alert('Введенные данные некорректны, повторите ввод.');
		return;
	}
	
	if (isHasEvent) {
		if (i != -1 
		&& (eventParticipants.getAttribute('disabled') != 'disabled' || eventParticipants.getAttribute('disabled') != 'disabled') 
		&& confirm('Сохранить изменения?')) {
			if (eventParticipants.getAttribute('disabled') != 'disabled') {
				eventsList[i].participants = eventParticipantsValue;		
			}
			if (eventDescription.getAttribute('disabled') != 'disabled') {
				eventsList[i].description = eventDescriptionValue;		
			}
			loadCalendar(new Date(eventDateValue.getFullYear(), eventDateValue.getMonth(), 1), false);
			setSelectedDayByDate(eventDateValue, false);
			closeAddEventPopup();
		} else {
			closeAddEventPopup();
		}
	} else {
		var j = findEventByDate(eventDateValue);
		if (j != -1) {
			if (confirm('На заданную дату уже создано событие (' + eventsList[j].name + '), заменить его?')) {
				deleteEvent(j);
				j = -1;
			}		
		}
		if (j == -1) {
			var event_ = new Event_(eventNameValue, eventDateValue, eventParticipantsValue, eventDescriptionValue);
			eventsList.push(event_);
			sortEventsList();
			closeAddEventPopup();
		}
		if (j == -1 || confirm('Перейти к уже существующему событию?')) { 	
			loadCalendar(new Date(eventDateValue.getFullYear(), eventDateValue.getMonth(), 1), false);
			setSelectedDayByDate(eventDateValue, false);
		}
		
	}
}

// Удалить событие выбранной ячейки
function deleteSelectedEvent() {
	if (confirm('Вы действительно хотите удалить выбранное событие?')) {
		var selected = document.getElementsByClassName('selected')[0],
			day = selected.getElementsByClassName('day')[0],
			dayID = day.getElementsByClassName('day_id')[0],
			date = new Date(Date.parse(dayID.value)),
			i = findEventByDate(date);
			
			if (i != -1) {
				deleteEvent(i);
			}	
		loadCalendar(new Date(date.getFullYear(), date.getMonth(), 1), false);
		setSelectedDayByDate(date, false);
		closeAddEventPopup();
	}
}

// Функция, возвращающая дату из строки русском варианте
function getDateFromString(stringToParse) {
	var arr,
		day,
		month,
		year,
		date;
	
	if (stringToParse.match(/\b.\b/)) {
		arr = stringToParse.replace(/\s+/g, ' ').split(' ');
	} else {
		arr = stringToParse.replace(/ +(?= )/g, '').split(' ');	
	}
	
	if (arr.length < 2) {
		arr = stringToParse.split('.');
	}
	if (arr.length >= 2) {
		day = parseInt(arr[0]);
		month = parseInt(arr[1]);
		if (isNaN(month)) {
			month = getMonthNumber(arr[1]);
		} else {
			month--;
		}
		if (arr.length == 2) {
			year = today.getFullYear();
		} else {
			year = arr[2];
		}
		date = new Date(year, month, day);
		if (isNaN(date.getTime())) {
			return null;
		} else {
			return date;
		}
	}
}

// Функция, возвращающая номер месяца из его названия в русском варианте
function getMonthNumber(monthName) {
	var months = ['янв', 'фев', 'мар', 'апр', 'ма', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
	for (var i = 0; i <= 11; i++) {
		if (monthName.toLowerCase().indexOf(months[i]) != -1) {
			return i;
		}
	}
	return -1;
}

// Проверка доступности localStorage
function isLocalStorageAvailable() {
	try {
		return 'localStorage' in window && window['localStorage'] != null;
	} catch (e) {
		return false;
	}
}

// Загрузить данные из локального хранилища
function loadDataFromLocalStorage() {
	var item;
	if (isLocalStorageAvailable()) {
		item = localStorage.getItem('eventsList');
	} else if ($.jStorage.storageAvailable()) {
		item = $.jStorage.get('eventsList');
	}
	if (item != null) {
		eventsList = JSON.parse(item, function(key, value) {
		  if (key == 'date') return new Date(Date.parse(value));
		  return value;
		});
	}
}

// Сохранить данные в локальное хранилище
function saveDataToLocalStorage() {
	if (isLocalStorageAvailable()) {
		localStorage.clear();
		localStorage.setItem('eventsList', JSON.stringify(eventsList));
	} else if ($.jStorage.storageAvailable()) {
		$.jStorage.flush();
		$.jStorage.set('eventsList', JSON.stringify(eventsList));
	}
}
