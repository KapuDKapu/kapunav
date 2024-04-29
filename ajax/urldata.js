// 整体思路如下
// （1）页面加载时调用函数readexcel读取excel
// （2）readexcel读取内容转化为数组，将数组赋值给addneirong
// （3）addneirong里面调用的2个函数creativeurls、creativenav，分别生成侧边连和导航详细地址的html代码，然后将html代码插入到页面对应位置。


// var changyongallurls = [
// ['读取excel1111','读取excel（仅读取第一个sheet）1111','https://blog.haoji.me/js-excel.html','ico/flomo.png'],
// ['读取excel2222','2222读取excel（仅读取第一个sheet）2222','https://blog.haoji.me/js-excel.html','ico/flomo.png']
// ]

//这是区分类别的html代码片段
//var flhtml_changyong_begin = '<div class="d-flex flex-fill "><h4 class="text-gray text-lg mb-4"> <i class="site-tag iconfont icon-tag icon-lg mr-1" id="term-2"></i> '
var flhtml_changyong_begin = '<div class="d-flex flex-fill "><h4 class="text-gray text-lg mb-4"> <i class="site-tag iconfont icon-tag icon-lg mr-1" id="'
var flhtml_changyong_mid0 = '"></i> '
//var u_lb = 'flomo'
var flhtml_changyong_mid = ' </h4> <div class="flex-fill"></div> </div> <div class="row "> '
var flhtml_changyong_end = '</div></div>'
//var u_name = 'flomo'
//var u_miaoshu = '像发微博一样记笔记'
//var u_url = 'https://v.flomoapp.com/'
//var u_ico = 'ico/flomo.png'
var url_begin = '<div class="url-card col-6  col-sm-6 col-md-4 col-xl-5a col-xxl-6a   "> <div class="url-body default"> <a href="'
var url_mid1 = '" target="_blank" data-id="689"  class="card no-c  mb-4 site-689"  title="'
var url_mid5 = '"> <div class="card-body"> <div class="url-content d-flex align-items-center"> <div class="url-img rounded-circle mr-2 d-flex align-items-center justify-content-center"> <img class="lazy" src="'
var url_mid2 = '" data-src="'
var url_mid4 = '" onerror="javascript:this.src=' + "'images/wangzhi2.png' " + '" alt=" "> </div> <div class="url-info flex-fill"> <div class="text-sm overflowClip_1"> <strong>'
var url_mid3 = '</strong> </div> <p class="overflowClip_1 m-0 text-muted text-xs">'
var url_end = '</p> </div> </div> </div> </a> </div> </div> '

var suozhang = '<h4 class="text-gray text-lg mb-4"> <i class="iconfont icon-book-mark-line icon-lg mr-2" id="friendlink"></i>友情链接 </h4> <div class="friendlink text-xs card"> <div class="card-body"> <a href="https://liutongxu.github.io" title="有范的导航网站" target="_blank">所长导航</a> </div> </div>'


//网页收藏
var lixianshoucang = '<li class="sidebar-item"><a href="./timeline/timeLine.html"><i class="iconfont icon-shoucang icon-fw icon-lg mr-2"></i><span>网页收藏</span></a></li>'



//转化html--不读取excel--使用最上面常量的
// function cyurls2html(changyongallurls) {
// 	var res = changyongallurls.forEach(function (item, index, array) {
// 		var u_name = item[0];
// 		var u_url = item[2];
// 		var u_ico = item[5];
// 		//var u_ico = 'ico/flomo.png'
// 		var u_miaoshu = item[1];
// 		cotenthtml = u_name + "--------" + u_url + "--------" + u_miaoshu
// 		cotenthtml = cotenthtml + url_begin + u_url + url_mid1 + u_ico + url_mid2 + u_name + url_mid3 + u_miaoshu + url_end;
// 		var html = flhtml_changyong_begin + cotenthtml + flhtml_changyong_end;
// 		return html;
// 	})
// }



// 将csv转换成表格
function csv2table(csv) {
	var urllists = []
	var rows = csv.split('\n');
	//rows.pop(); // 最后一行没用的
	rows.forEach(function (row, idx) {
		var columns = row.split(',');
		urllists.push(columns);
	});
	return urllists;
}


//html页面调用的函数
function readexcel(url) {
	var xhr = new XMLHttpRequest();
	xhr.open('get', url, true);
	xhr.responseType = 'arraybuffer';
	xhr.onload = function (e) {
		if (xhr.status == 200) {
			var data = new Uint8Array(xhr.response)
			var workbook = XLSX.read(data, { type: 'array' });
			var sheetNames = workbook.SheetNames; // 工作表名称集合
			var worksheet = workbook.Sheets[sheetNames[0]]; // 这里我们只读取第一张sheet
			var csv = XLSX.utils.sheet_to_csv(worksheet);
			var changyongallurls = csv2table(csv);
			addneirong(changyongallurls);
		}
	};
	xhr.send();
}


// 往页面插入导航html代码
function addneirong(changyongallurls) {
	var html = creativeurls(changyongallurls);  		//测试区分类别的代码
	var nav1 = creativenav(changyongallurls);
	document.getElementById('content').innerHTML = html;
	document.getElementById('cebianlian').innerHTML = nav1;
}



//生成详细导航html的函数--区分类别
function creativeurls(changyongallurls) {
	var html = ''
	var onelb = ''
	var u_lbs = []
	var nav = ''
	var res = changyongallurls.forEach(function (item, index, array) {
		if (u_lbs.indexOf(item[4]) == -1) {					//判断数组内是否存在这个类别
			u_lbs.push(item[4])                               //类别去重，整理成一个数组
		}
	})
	for (let i = 0; i < u_lbs.length; i++) {
		// 遍历数组，对每个元素进行操作
		onelb = flhtml_changyong_begin + u_lbs[i] + flhtml_changyong_mid0 + u_lbs[i] + flhtml_changyong_mid
		var res = changyongallurls.forEach(function (item, index, array) {
			if (item[4] == u_lbs[i] && item[3] == '是') {					//判断数组内是否存在这个类别
				var u_name = item[0];
				var u_url = item[2];
				var u_ico = item[5];
				var u_icoby = item[6];
				var u_miaoshu = item[1];
				onelb = onelb + url_begin + u_url + url_mid1 + u_miaoshu + url_mid5 + u_icoby + url_mid2 + u_ico + url_mid4 + u_name + url_mid3 + u_miaoshu + url_end;                            //类别去重，整理成一个数组
			}

		})
		onelb = onelb + flhtml_changyong_end
		html = html + onelb
	}
	html = html + suozhang
	return html;
}


//单个侧边连代码
function addnav(urllb) {
	var celan_begin = '<li class="sidebar-item"> <a href="#'
	var celan_mid = '" class="smooth"> <i class="iconfont icon-zixun1 icon-fw icon-lg mr-2"></i> <span>'
	var celan_end = '</span> </a> </li>'
	var navhtml = celan_begin + urllb + celan_mid + urllb + celan_end
	return navhtml
}

//生成全部导航侧边连
function creativenav(changyongallurls) {
	var u_lbs = []
	var nav = ''
	var res = changyongallurls.forEach(function (item, index, array) {
		if (u_lbs.indexOf(item[4]) == -1) {					//判断数组内是否存在这个类别
			u_lbs.push(item[4])                               //类别去重，整理成一个数组
		}
	})
	for (let i = 0; i < u_lbs.length; i++) {
		// 遍历数组，对每个元素进行操作
		nav = nav + addnav(u_lbs[i]);
	}
	nav = nav + lixianshoucang
	return nav;
}

