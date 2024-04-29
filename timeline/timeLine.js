// 由于我是将它应用于我的博客 https://nowtime.cc/time-line.html 的
// 所以数据格式都是按照我的意愿设置的，无法满足大众口味
// 如有需要，请自己酌情修改

// var data = [{ "title": "ffmpeg \u4f7f\u7528\u65b9\u6cd5\u5408\u96c6", "link": "https:\/\/nowtime.cc\/software\/834.html", "time": "1578718860" }, { "title": "CSS3 \u52a8\u753b\u5361\u987f\u6027\u80fd\u4f18\u5316\u89e3\u51b3\u65b9\u6848", "link": "https:\/\/nowtime.cc\/html5\/827.html", "time": "1575768660" }];
var data =
    [   
		
		{
            "title": "导出Markdown文档为其他格式（PDF、HTML等）",
            "link": "./files/导出Markdown文档为其他格式（PDF、HTML等）.html",
            "time": "1708423288"
        },
		{
            "title": "宝塔面板一键卸载",
            "link": "./files/宝塔面板一键卸载.html",
            "time": "1707185636"
        },
		{
            "title": "发现导航：纯静态、强大、支持SEO和在线编辑的导航网站",
            "link": "./files/发现导航：纯静态、强大、支持SEO和在线编辑的导航网站.html",
            "time": "1707185636"
        },
		{
            "title": "人生没有后悔药- 高尿酸管理笔记",
            "link": "./files/人生没有后悔药- 高尿酸管理笔记.html",
            "time": "1707037273"
        },
		{
            "title": "完全没想到，居然有开发者为了微信，开发了一款特色安卓应用：apk.1 安装器",
            "link": "./files/完全没想到，居然有开发者为了微信，开发了一款特色安卓应用：apk.1 安装器.html",
            "time": "1707028183"
        },
		{
            "title": "Python_Flask打造属于自己的Rss安全信息流",
            "link": "./files/Python_Flask打造属于自己的Rss安全信息流.html",
            "time": "1707026909"
        },
		{
            "title": "在 Windows11上安装 Windows Subsystem for Android 并安装运行 APK 文件",
            "link": "./files/在 Windows11上安装 Windows Subsystem for Android 并安装运行 APK 文件.html",
            "time": "1706260168"
        },
		{
            "title": "windows11家庭中文版开启Hyper-V",
            "link": "./files/windows11家庭中文版开启Hyper-V.html",
            "time": "1706260168"
        },
        {
            "title": "Vercel部署NotionNext_将notion部署为博客",
            "link": "./files/Vercel部署NotionNext_将notion部署为博客.html",
            "time": "1706260168"
        },
        {
            "title": "一个纯净的B站视频下载工具",
            "link": "./files/一个纯净的B站视频下载工具.html",
            "time": "1706257720"
        },
        {
            "title": "TV直播软件及直播源",
            "link": "./files/TV直播软件及直播源.html",
            "time": "1706257714"
        },
        {
            "title": "在线屏幕尺寸比较-Howbigg",
            "link": "./files/在线屏幕尺寸比较-Howbigg.html",
            "time": "1706254900"
        },
        {
            "title": "安卓NAS的安装和设置说明",
            "link": "./files/安卓NAS的安装和设置说明.html",
            "time": "1706251371"
        },
        {
            "title": "安卓NAS的安装和设置说明",
            "link": "./files/安卓NAS的安装和设置说明.html",
            "time": "1706251371"
        },
        {
            "title": "alist重置密码命令",
            "link": "./files/alist重置密码命令.html",
            "time": "1706251364"
        },
        {
            "title": "PowerToys异父异母的“亲”兄弟，来了",
            "link": "./files/PowerToys异父异母的“亲”兄弟，来了.html",
            "time": "1706233472"
        },
        {
            "title": "hexo-admin插件windows系统插入图片失败问题解决，以及插件的一点点优化",
            "link": "./files/hexo-admin插件windows系统插入图片失败问题解决，以及插件的一点点优化.html",
            "time": "1706176090"
        },
        {
            "title": "windows鼠标右击单击菜单添加打开方式",
            "link": "./files/windows鼠标右击单击菜单添加打开方式.html",
            "time": "1706175113"
        },
        {
            "title": "如何更改VS Code的文件排序？",
            "link": "./files/如何更改VS Code的文件排序？.html",
            "time": "1706173122"
        },
        {
            "title": "html手机端适配",
            "link": "./files/html手机端适配.html",
            "time": "1706148132"
        },

    ]
//调用函数，渲染“时间线”
xuanran_time_line(data);

/**
 * 渲染时间线
 * @param data {[]}            需要进行时间线分割的数据
 * @param selector string      css 选择器
 */
function xuanran_time_line(data = [], selector = ".time-line") {
    let time_line = document.querySelector(selector);
    let _group_month = group_month(data), html;

    time_line.innerHTML = '';//清空时间线
    for (let item in _group_month) {
        html = '<li class="tl-header">\n' +
            '    <h2>' + item + '</h2>\n' +
            '</li>' +
            '<ul class="tl-body">';

        for (let items in _group_month[item]) {
            ttt = _group_month[item][items];
            html += '<li>\n' +
                '    <span>' + time_d(ttt["time"]) + '</span>\n' +
                '    <h3>\n' +
                '        <a href="' + ttt["link"] + '" target="_blank">' + ttt["title"] + '</a>\n' +
                '    </h3>\n' +
                '</li>\n'
        }
        html += '</ul>';

        time_line.innerHTML += html;
    }
    time_line.innerHTML += '<li class="tl-header start">\n' +
        '    <h2>开始</h2>\n' +
        '</li>';
}

/**
 * 按月份分组
 * @param data {[]}
 * @returns {[]}
 */
function group_month(data) {
    let result = [];

    for (let item in data) {
        date = time_ym(data[item]['time']);

        if (!result[date]) {
            result[date] = [data[item]];
        } else {
            result[date].push(data[item]);
        }
    }

    return result;
}

/**
 * 时间戳{秒级} 转 年月
 * @param dates
 * @returns {string}
 */
function time_ym(dates) {
    let date = new Date(dates * 1000);

    let Y = date.getFullYear() + '年';
    let M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '月';

    return Y + M;
}

/**
 * 时间戳{秒级} 转 日
 * @param dates
 * @returns {string}
 */
function time_d(dates) {
    let date = new Date(dates * 1000);
    return (date.getDate() < 10 ? '0' + (date.getDate()) : date.getDate()) + '日';
}
