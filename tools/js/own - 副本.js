function AjaxCreateCardNumber() {
	$.ajax({
		var nname = Mock.mock('@cname');
		$('#cardnumber').val(nname);
		}
	})
}

function AjaxCreateName() {
	$.ajax({
		var data = Mock.mock('@cname');
		$('#name').val(data);
		}
	})
}

function AjaxCreateSsn() {
	$.ajax({
		url: '/create_ssn/',
		type: 'GET',
		success: function (data) {
		data = JSON.parse(data);
		$('#ssn').val(data);
		}
	})
}

function AjaxCreatePhoneNumber() {
	$.ajax({
		url: '/create_phone/',
		type: 'GET',
		success: function (data) {
		data = JSON.parse(data);
		$('#phonenumber').val(data);
		}
	})
}

function AjaxCreateCompany() {
	$.ajax({
		url: '/create_company/',
		type: 'GET',
		success: function (data) {
		data = JSON.parse(data);
		$('#company').val(data);
		}
	})
}

function AjaxCreateAddress() {
	$.ajax({
		url: '/create_address/',
		type: 'GET',
		success: function (data) {
		data = JSON.parse(data);
		$('#address').val(data);
		}
	})
}

function AjaxCreateEmail() {
	$.ajax({
		url: '/create_email/',
		type: 'GET',
		success: function (data) {
		data = JSON.parse(data);
		$('#email').val(data);
		}
	})
}

function AjaxCreateuuid() {
	$.ajax({
		url: '/create_uuid/',
		type: 'GET',
		success: function (data) {
		data = JSON.parse(data);
		$('#uuid').val(data);
		}
	})
}

function AjaxCreatexycode() {
	$.ajax({
		url: '/xinyongcode/',
		type: 'GET',
		success: function (data) {
		data = JSON.parse(data);
		$('#xycode').val(data);
		}
	})
}

function AjaxCreatecarcard() {
	$.ajax({
		url: '/create_carcard/',
		type: 'GET',
		success: function (data) {
		data = JSON.parse(data);
		$('#carcard').val(data);
		}
	})
}

function AjaxCreateAll() {
	$.ajax({
		url: '/create_all/',
		type: 'GET',
		success: function (data) {
		data = JSON.parse(data);
		var name = data['name'];
		var card_number = data['card_number'];
		var ssn = data['ssn'];
		var phone_number = data['phone_number'];
		var company = data['company'];
		var address = data['address'];
		var email = data['email'];
		var uuid1 = data['uuid1'];
		var xycode = data['xycode'];
		var card = data['card'];
		$('#name').val(name);
		$('#cardnumber').val(card_number);
		$('#ssn').val(ssn);
		$('#phonenumber').val(phone_number);
		$('#company').val(company);
		$('#address').val(address);
		$('#email').val(email);
		$('#uuid').val(uuid1);
		$('#xycode').val(xycode);
		$('#carcard').val(card);
		}
	})
}

//文本域自动拓展
function makeExpandingArea(el) {
	var timer = null;
	//由于ie8有溢出堆栈问题，故调整了这里
	var setStyle = function (el, auto) {
		if (auto) el.style.height = 'auto';
		el.style.height = el.scrollHeight + 'px';
	}
	var delayedResize = function (el) {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
		timer = setTimeout(function () {
			setStyle(el)
		}, 200);
	}
	if (el.addEventListener) {
		el.addEventListener('input', function () {
			setStyle(el, 1);
		}, false);
		setStyle(el)
	} else if (el.attachEvent) {
		el.attachEvent('onpropertychange', function () {
			setStyle(el)
		})
		setStyle(el)
	}
	if (window.VBArray && window.addEventListener) { //IE9
		el.attachEvent("onkeydown", function () {
			var key = window.event.keyCode;
			if (key == 8 || key == 46) delayedResize(el);

		});
		el.attachEvent("oncut", function () {
			delayedResize(el);
		}); //处理粘贴
	}
}
function tt(obid) {
	var textarea = document.getElementById(obid);
	makeExpandingArea(textarea);
}

