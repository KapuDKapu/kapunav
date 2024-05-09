var kgflag = true;  /*标记符，如果是输入法产生的空格则为false，其他情况则为true*/
var timeType = 0.0;  /*跟打时间，初始值为0*/
var timeout;     /*用来返回计时功能产生的setTimeout对象*/
var typeLen = 0;
var isStart = false;
var isEnd = false;
var isPause = false;
var pauseTime = 0;
var startTime = 0;
var keyCount = 1;
var keySpeed = 0;
var wordPerKey = 4.0;
var modifyCount = 0;
var errorCount = 0;
var isCharEn = false;
var isCharEn = false;
isSpace();
function isSpace() {
	document.onkeydown = function (event) {
		var e = event || window.event || arguments.callee.caller.arguments[0];
		if (e && e.keyCode == 32) {
			kgflag = true;
		} else {
			kgflag = false;
		}
		if (e) { keyCount++; }
		isCharEn = false;
	};
	document.onkeypress = function (event) {
		var e = event || window.event || arguments.callee.caller.arguments[0];
		if (e && (e.keyCode >= 97 && e.keyCode <= 122 || e.keyCode >= 65 && e.keyCode <= 90)) {
			isCharEn = true;
		}
	};
	document.onkeyup = function (event) {
		var e = event || window.event || arguments.callee.caller.arguments[0];
		if (e && (e.keyCode == 16)) {
			isCharEn = true;
		}
	};
	setTimeout(isSpace, 100);
}
function checks() {
	var dzq = $("#dzq");      //获取对照区元素span
	var gdq = $("#gdq");		//获取跟打区元素textarea
	var aimWord = dzq.text();
	var n = aimWord.length;	//对照区文本长度

	gdq.val(gdq.val().replace("\n", ""));	/*替换跟打区中所有回车*/
	var newWord = gdq.val(); //跟打区文本
	if (!isStart && newWord.length > 0) {
		isStart = true;
		startTime = new Date().getTime();
		timedCount();
	}
	var a = newWord.substr(newWord.length - 1, 1);
	if (a == " " && !kgflag) {
		newWord = newWord.substr(0, newWord.length - 1);
	} else {
		newWord = newWord.substr(0, newWord.length);
	}
	if (a >= "a" && a <= "z") {
		if (!isCharEn) {
			newWord = newWord.substr(0, typeLen);
		}
	}
	if (typeLen - newWord.length > 0) {
		modifyCount += typeLen - newWord.length;
	}
	typeLen = newWord.length;
	$("#percent").css("width", 100.0 * typeLen / n + "%");
	var ht = '';
	var i;
	var dds = "#aaaaaa";
	var dcs = "#ef5b9c";
	var bjs = "#ffffff";
	errorCount = 0;
	for (i = 0; i < n; i++) {
		if (i < typeLen) {
			if (aimWord[i] == newWord[i]) {
				//已输入正确字符
				ht += "<span style=\"background-color:" + dds + ";\">" + aimWord[i] + "</span>";
			} else {
				//已输入错误字符
				ht += "<span style=\"background-color:" + dcs + ";\">" + aimWord[i] + "</span>";
				errorCount++;
			}
		} else {
			ht += "<span style=\"background-color:" + bjs + ";\">" + aimWord.substr(typeLen, n) + "</span>";
			break;
		}
	}
	dzq.html(ht);
	if (typeLen > 38) {
		dzq.scrollTop(parseInt((typeLen - 38) / 18) * 23);
	} else {
		dzq.scrollTop(0);
	}

	if (typeLen >= n && !isEnd) {
		gdq.val(newWord.substr(0, n));
		if (newWord.charAt(n - 1) == dzq.text().charAt(n - 1)) {
			clearTimeout(timeout);
			gdq.attr("disabled", true);
			isEnd = true;
			showResult();
		}
	}
	setTimeout(checks, 100);
}


function timedCount() {
	timeType = pauseTime + (new Date().getTime() - startTime) / 1000 + 0.5;
	$('#times').text(Math.floor(timeType));
	$('#speed').text((60.0 * typeLen / timeType).toFixed(2));
	$('#modifyCount').text(modifyCount);
	$('#errorCount').text(errorCount);
	if (typeLen > 5) {
		$('#keySpeed').text((keyCount / timeType).toFixed(2));
		$('#keyCode').text((keyCount / typeLen).toFixed(2));
	}
	timeout = setTimeout("timedCount()", 100);
}


function loadArticle(text_article) {
	var text = text_article;
	if (text == null) return false;
	text = text.replace(/\n/g, "");
	text = text.replace(/\s/g, "");
	if (!(text == null || text.length == 0)) {
		if (text.length > 1024) {
			alert('打文长度不能超过1024，会累坏的！！！');
			return false;
		}
		if (text.length < 10) {
			alert('打文长度小于10，那样多没意思！！！');
			return false;
		}
		text = text.replace(/\s+/g, "");
		$("#dzq").text(text.toUpperCase());
		$("#wordCount").text(text.length);
		reType();
	}
	return true;
}

function reType() {
	var gdq = $("#gdq");
	gdq.val("");
	gdq.attr("disabled", false);
	isStart = false;
	isEnd = false;
	timeType = 0.0;
	keyCount = 1;
	modifyCount = 0;
	errorCount = 0;
	typeLen = 0;  //字数
	isPause = false;
	clearTimeout(timeout);
	$('#times').text("0");
	$('#speed').text("0.00");
	$('#keySpeed').text("0.00");
	$('#keyCode').text("0.00");
	$('#modifyCount').text("0");
	$('#errorCount').text("0");
}
function pauseCount() {
	var gdq = $("#gdq");
	if (!isStart || isEnd) { return; }
	if (!isPause) {
		clearTimeout(timeout);
		isPause = true;
		gdq.attr("disabled", true);
	} else {
		pauseTime = timeType;
		startTime = new Date().getTime();
		timedCount();
		isPause = false;
		gdq.attr("disabled", false);
	}
}
function showResult() {
	console.log("showResult...");
}

function clearCustomText() {
	$("#custom_text").val('');
}
function loadCustomText() {
	var customText = $("#custom_text").val();
	customText = customText.replace(/[<\s>]/g, "");
	var flag = loadArticle(customText);
	if (flag == true) {
		myloadTitle('自定义');
	}
}
function myloadArticle(obj) {
	loadArticle($(obj).children().eq(0).attr("content"));
	myloadTitle($(obj).children().eq(0).attr("title"));
}
function myloadTitle(text) {
	$("#typetool-title").text(text);
}

function zyhTranTab(index) {
	if (index == 0) {
		$(".the-tab-div").eq(0).show();
		$(".the-tab-div").eq(1).hide();
		$(".tran-div-oper li").eq(0).removeClass();
		$(".tran-div-oper li").eq(0).addClass("selected-li-tab");
		$(".tran-div-oper li").eq(1).removeClass();
		$(".tran-div-oper li").eq(1).addClass("unselected-li-tab");
	} else {
		$(".the-tab-div").eq(1).show();
		$(".the-tab-div").eq(0).hide();
		$(".tran-div-oper li").eq(1).removeClass();
		$(".tran-div-oper li").eq(1).addClass("selected-li-tab");
		$(".tran-div-oper li").eq(0).removeClass();
		$(".tran-div-oper li").eq(0).addClass("unselected-li-tab");
	}
}

function searchArticle() {
	var searchText = $("#searchText").val();
	if (searchText != null && searchText.replace(/\s/g, "") != "") {
		$("#article_search_result").empty();
		var articleLiArray = $("#article_list").children("li");
		var i = 0;

		for (i = 0; i < articleLiArray.size(); i++) {
			if (articleLiArray.eq(i).children(".article_title").text().indexOf(searchText) >= 0)
				$("#article_search_result").append("<li onclick='myloadArticle(this)'>" + articleLiArray.eq(i).html() + "</li>");
		}

		$("#article_list").hide();
		$("#article_search_result").show();

	} else {
		$("#article_search_result").hide();
		$("#article_list").show();
	}
}
function changeSearchText() {
	var searchText = $("#searchText").val();
	if (searchText == null || searchText.replace(/\s/g, "") == "")
		searchArticle();
}

function loadLocalArticles() {
	var resHTML = "";
	for (var article of articles) {
		resHTML += "<li onclick='myloadArticle(this)'><span class='article_title' title='" + article.title + "' content='" + article.content + "'>" + article.title + "</span></li>";
	}
	$("#article_list").html(resHTML);

}

$(document).ready(function () {
	checks();
	loadLocalArticles();
});