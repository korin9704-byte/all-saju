// 자동 생성: 인생 사주 모바일 뷰어 CSS (샘플 뷰어 이식, .lifebook 스코프)
export const LIFEBOOK_CSS = `
.lifebook{position:fixed;inset:0;z-index:60;overflow-y:auto;background:#EFE7FA;-webkit-overflow-scrolling:touch;}
.lifebook{--ink:#4A3A72;--body:#7A6B9E;--mute:#9C8FBF;--line:#E7DDF8;--soft:#F3EDFB;--pink:#C95FC0;--vio:#8F7BD6;}
.lifebook *{box-sizing:border-box}
.lifebook{margin:0;background:#EFE7FA;}
.lifebook{font-family:'Gowun Dodum','Apple SD Gothic Neo',sans-serif;color:var(--ink);}
.lifebook .app{max-width:480px;margin:0 auto;background:#FDFBFF;min-height:100dvh;position:relative;display:flex;flex-direction:column;}
.lifebook header.top{position:sticky;top:0;z-index:20;background:rgba(253,251,255,.94);backdrop-filter:blur(6px);border-bottom:1px solid var(--line);padding:12px 16px;display:flex;align-items:center;gap:10px;}
.lifebook .logo{font-family:'Gowun Dodum';letter-spacing:.08em;font-size:15px;flex:none;}
.lifebook .menu-btn{margin-left:auto;border:0;background:none;color:var(--ink);font-size:19px;line-height:1;padding:2px 2px;cursor:pointer;}
.lifebook main{padding:22px 20px 24px;flex:1 0 auto;}
.lifebook .view{display:none;animation:lb-fade .25s ease;}
.lifebook .view.on{display:block;}
.lifebook .part{margin:0 0 8px;}
.lifebook .part span{display:inline-block;background:var(--soft);color:var(--ink);font-size:11.5px;letter-spacing:.06em;padding:4px 12px;border-radius:999px;}
.lifebook .chapter{font-family:'Gowun Dodum';font-weight:400;font-size:22px;margin:0 0 18px;line-height:1.4;}
.lifebook .para{font-size:15px;line-height:2.0;margin:0 0 14px;text-align:justify;}
.lifebook .para.small{font-size:12px;color:var(--mute);}
.lifebook .hl{color:var(--pink);font-weight:400;}
.lifebook .sub-h{font-family:'Gowun Dodum';font-weight:400;font-size:16.5px;margin:24px 0 8px;color:#7761C8;}
.lifebook .sec-hero{display:flex;flex-direction:column;align-items:center;margin:44px 0 20px;}
.lifebook .sec-hero .sd-hj{font-family:'Gowun Dodum';font-size:26px;line-height:1.55;color:var(--ink);letter-spacing:.08em;text-align:center;}
.lifebook .sec-hero .sd-line{width:20px;height:1.5px;background:var(--ink);opacity:.45;margin:12px 0;}
.lifebook .sec-hero .sd-kr{font-size:15px;color:var(--body);letter-spacing:.18em;}
.lifebook .sec-div{display:flex;align-items:center;gap:12px;margin:34px 0 16px;}
.lifebook .sec-div span{font-family:'Gowun Dodum';font-size:18px;color:var(--ink);flex:none;}
.lifebook .sec-div::before,.lifebook .sec-div::after{content:'';height:1px;background:var(--line);flex:1;}
.lifebook .nyan{display:flex;gap:9px;align-items:flex-start;margin:16px 0;}
.lifebook .avatar{flex:none;width:38px;height:38px;border-radius:50%;background:#F6DDF0 center/cover no-repeat;overflow:hidden;}
.lifebook .nyan.noav .avatar{visibility:hidden;}
.lifebook .say{position:relative;}
.lifebook .nyan.tail .say::after{content:'';position:absolute;left:-6px;bottom:2px;width:14px;height:14px;background:#EDE6F9;border-radius:0 0 14px 0;clip-path:polygon(0 100%,100% 100%,100% 0);}
.lifebook .me{display:flex;justify-content:flex-end;margin:14px 0;}
.lifebook .say-me{position:relative;max-width:80%;background:linear-gradient(90deg,var(--vio),var(--pink));color:#fff;border-radius:16px;padding:12px 16px;font-size:14.5px;line-height:1.85;}
.lifebook .say-me::after{content:'';position:absolute;right:-6px;bottom:2px;width:14px;height:14px;background:var(--pink);border-radius:0 0 0 14px;clip-path:polygon(0 100%,100% 100%,0 0);}
.lifebook .nyan.noav{margin-top:-6px;}
.lifebook .say{background:#EDE6F9;border:0;border-radius:16px;padding:12px 16px;font-size:14.5px;line-height:1.85;}
.lifebook .say b{font-family:'Gowun Dodum';font-weight:400;color:#7761C8;}
.lifebook .tbl{width:100%;border-collapse:collapse;margin:8px 0 18px;font-size:12.5px;}
.lifebook .tbl th,.lifebook .tbl td{border:1px solid var(--line);padding:7px 4px;text-align:center;}
.lifebook .tbl th{background:var(--soft);font-weight:400;color:var(--body);}
.lifebook .bars{margin:6px 0 4px;}
.lifebook .bar-row{display:flex;align-items:center;gap:8px;margin:7px 0;}
.lifebook .bar-name{width:46px;font-family:'Gowun Dodum';font-size:14px;white-space:nowrap;}
.lifebook .bar-name small{font-size:11px;color:var(--mute);margin-left:1px;}
.lifebook .bar-track{flex:1;height:13px;background:var(--soft);border-radius:7px;overflow:hidden;}
.lifebook .bar-fill{height:100%;border-radius:7px;}
.lifebook .oh-목{background:#8FBF8F}
.lifebook .oh-화{background:#E58A9E}
.lifebook .oh-토{background:#D9B36A}
.lifebook .oh-금{background:#A8A8B8}
.lifebook .oh-수{background:#7FA8D9}
.lifebook .bar-val{width:118px;font-size:11px;color:var(--body);}
.lifebook .bar-val em{font-style:normal;color:var(--pink);}
.lifebook .gauge{margin:10px 2px 16px;}
.lifebook .g-lab{position:relative;height:22px;}
.lifebook .g-cur{position:absolute;transform:translateX(-50%);font-size:13px;color:var(--pink);}
.lifebook .g-track{position:relative;height:10px;border-radius:5px;background:linear-gradient(90deg,#DCD2F2,var(--vio),var(--pink));}
.lifebook .g-dot{position:absolute;top:50%;transform:translate(-50%,-50%);width:20px;height:20px;border-radius:50%;background:#fff;border:4px solid var(--pink);box-shadow:0 1px 4px rgba(74,58,114,.25);}
.lifebook .g-ends{display:flex;justify-content:space-between;font-size:11px;color:var(--mute);margin-top:8px;}
.lifebook .ch-banner{background:linear-gradient(135deg,#EDE6F9 0%,#FBE7F3 55%,#FDEFE3 100%);border-radius:16px;padding:38px 20px 34px;text-align:center;margin:2px 0 22px;}
.lifebook .ch-label{font-size:12px;color:var(--pink);letter-spacing:.24em;margin:0 0 8px;}
.lifebook .ch-title{font-family:'Gowun Dodum';font-weight:400;font-size:27px;margin:0;color:var(--ink);}
.lifebook .card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px 14px 16px;margin:20px 0;}
.lifebook .card.slim{padding:8px 14px 4px;}
.lifebook .card.slim .gauge{margin:6px 2px 8px;}
.lifebook .card-title{font-family:'Gowun Dodum';font-weight:400;font-size:18px;text-align:center;margin:0 0 4px;}
.lifebook .card-sub{text-align:center;font-size:12px;color:var(--mute);margin:0 0 12px;}
.lifebook .card-desc{text-align:center;font-size:12.5px;color:var(--body);margin:0 0 12px;line-height:1.7;}
.lifebook .ms{table-layout:fixed;font-size:10.5px;margin:0;}
.lifebook .ms th,.lifebook .ms td{padding:6px 2px;line-height:1.55;vertical-align:middle;word-break:keep-all;}
.lifebook .ms th.corner,.lifebook .ms th:first-child{width:17%;}
.lifebook .ms small{font-size:9px;color:var(--mute);}
.lifebook .ms td small{color:var(--mute);}
.lifebook .ms .big{font-family:'Gowun Dodum';font-size:22px;background:#FBEFF7;line-height:1.15;padding:9px 2px 7px;}
.lifebook .ms .big span{display:block;font-size:10px;font-family:'Gowun Dodum';color:var(--mute);margin-top:2px;}
.lifebook .ms .dim{color:#C9BEE2;}
.lifebook .tbl td.wl{font-size:11.5px;text-align:left;padding-left:8px;word-break:keep-all;line-height:1.6;color:var(--body);}
.lifebook .tbl.wolun td:first-child{white-space:nowrap;font-size:12px;}
.lifebook .tbl.wolun td:nth-child(2),.lifebook .tbl.wolun td:nth-child(3){white-space:nowrap;font-size:12px;}
.lifebook .card-div{display:flex;align-items:center;gap:10px;margin:16px 2px;}
.lifebook .card-div::before,.lifebook .card-div::after{content:'';flex:1;height:1px;background:var(--line);}
.lifebook .card-div i{width:6px;height:6px;background:#CBBBE8;transform:rotate(45deg);border-radius:1px;}
.lifebook .ms.fs tr{opacity:.32;}
.lifebook .ms.fs tr.on{opacity:1;}
.lifebook .ms.fs tr.on th,.lifebook .ms.fs tr.on td{background:#fff;border-top:1.5px solid var(--ink);border-bottom:1.5px solid var(--ink);}
.lifebook .ms.fscol th,.lifebook .ms.fscol td{opacity:.32;}
.lifebook .ms.fscol .on-c{opacity:1;background:#fff;border-left:1.5px solid var(--ink);border-right:1.5px solid var(--ink);}
.lifebook .ms.fscol tr:first-child .on-c{border-top:1.5px solid var(--ink);}
.lifebook .ms.fscol tr:last-child .on-c{border-bottom:1.5px solid var(--ink);}
.lifebook .ms .big.el-목{background:#E7F1E7}
.lifebook .ms .big.el-화{background:#FAE7ED}
.lifebook .ms .big.el-토{background:#F7EEDC}
.lifebook .ms .big.el-금{background:#EDEDF2}
.lifebook .ms .big.el-수{background:#E6EFF8}
.lifebook .daeun-scroll{overflow-x:auto;margin:4px -2px 2px;-webkit-overflow-scrolling:touch;}
.lifebook .daeun{border-collapse:separate;border-spacing:0;min-width:620px;font-size:11.5px;margin:0;}
.lifebook .daeun th,.lifebook .daeun td{border-right:1px solid var(--line);border-bottom:1px solid var(--line);padding:8px 7px;text-align:center;white-space:nowrap;}
.lifebook .daeun tr:first-child th,.lifebook .daeun tr:first-child td{border-top:1px solid var(--line);}
.lifebook .daeun th{background:var(--soft);font-weight:400;color:var(--body);position:sticky;left:0;z-index:1;border-left:1px solid var(--line);box-shadow:-2px 0 0 #fff;}
.lifebook .daeun td.cur{background:#F6DDF0;}
.lifebook .daeun td.gj{font-family:'Gowun Dodum';font-size:13.5px;}
.lifebook .oh-penta-wrap{margin:6px auto 2px;max-width:290px;}
.lifebook .oh-penta{display:block;width:100%;height:auto;}
.lifebook .oh-chips{display:flex;gap:6px;margin:16px 2px 6px;}
.lifebook .oh-chip{position:relative;flex:1;border:1px solid var(--line);border-radius:12px;padding:12px 0 10px;text-align:center;background:#FDFBFF;}
.lifebook .oh-chip .oh-el{display:block;font-family:'Gowun Dodum';font-size:18px;line-height:1.2;}
.lifebook .oh-chip .oh-el small{display:block;font-size:10px;color:var(--mute);font-family:'Gowun Dodum';margin-top:2px;}
.lifebook .oh-badge{position:absolute;top:-8px;right:-4px;min-width:20px;height:20px;border-radius:10px;color:#fff;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0 5px;}
.lifebook .oc-목 .oh-el{color:#8FBF8F}
.lifebook .oc-화 .oh-el{color:#E58A9E}
.lifebook .oc-토 .oh-el{color:#D9B36A}
.lifebook .oc-금 .oh-el{color:#A8A8B8}
.lifebook .oc-수 .oh-el{color:#7FA8D9}
.lifebook .oc-목 .oh-badge{background:#8FBF8F}
.lifebook .oc-화 .oh-badge{background:#E58A9E}
.lifebook .oc-토 .oh-badge{background:#D9B36A}
.lifebook .oc-금 .oh-badge{background:#A8A8B8}
.lifebook .oc-수 .oh-badge{background:#7FA8D9}
.lifebook .oh-chip.zero .oh-el{opacity:.45}
.lifebook .oh-chip.zero .oh-badge{opacity:.55}
.lifebook .sub-note{font-size:12px;color:var(--mute);margin:0 0 10px;line-height:1.7;}
.lifebook .card .sub-h{margin-top:20px;}
.lifebook .card .sub-h:first-of-type{margin-top:14px;}
.lifebook .card.nt .sub-h:first-of-type{margin-top:2px;}
.lifebook .oh-bars .bar-val{width:92px;}
.lifebook .ys-chips{display:flex;gap:8px;margin:18px 2px 6px;}
.lifebook .ys-chip{position:relative;flex:1;text-align:center;border:1px solid var(--line);border-radius:12px;padding:16px 0 12px;background:#FDFBFF;}
.lifebook .ys-chip .ys-h{font-family:'Gowun Dodum';font-size:20px;color:var(--ink);display:block;}
.lifebook .ys-chip .ys-k{display:block;font-size:11px;color:var(--mute);margin-top:3px;}
.lifebook .ys-badge{position:absolute;top:-9px;left:50%;transform:translateX(-50%);border-radius:9px;color:#fff;font-size:10.5px;padding:2px 9px;white-space:nowrap;}
.lifebook .yc-금 .ys-badge{background:#A8A8B8}
.lifebook .yc-토 .ys-badge{background:#D9B36A}
.lifebook .yc-화 .ys-badge{background:#E58A9E}
.lifebook .ys-chip.main.yc-금{border-color:#A8A8B8;background:#F4F4F7;}
.lifebook .cover-view{margin:-22px -20px 0;}
.lifebook .cover-typo{background:linear-gradient(170deg,#F3EDFB 0%,#E7DDF8 60%,#F6DDF0 100%);min-height:calc(100dvh - 150px);display:flex;flex-direction:column;justify-content:center;padding:40px 20px 30px;}
.lifebook .cover-title{font-family:'Gowun Dodum';font-weight:400;font-size:46px;text-align:center;margin:10px 0 4px;letter-spacing:.04em;}
.lifebook .cover-typo .brand{text-align:center;font-size:16px;}
.lifebook .cover-typo .sub{text-align:center;color:var(--body);font-size:16px;margin:2px 0 8px;}
.lifebook .brand{font-family:'Gowun Dodum';letter-spacing:.08em;margin:0;}
.lifebook .cover-pillars{display:flex;gap:10px;justify-content:center;margin:18px 0 10px;}
.lifebook .cover-pillars span{background:#E8B7D8;border-radius:10px;padding:10px 11px;font-size:20px;line-height:1.4;font-family:'Gowun Dodum';text-align:center;}
.lifebook .meta{text-align:center;font-size:13px;color:var(--mute);}
.lifebook .start-btn{display:block;width:calc(100% - 40px);margin:22px auto 30px;height:52px;border:0;border-radius:26px;color:#fff;font-size:15px;font-family:'Gowun Dodum';background:linear-gradient(90deg,var(--vio),var(--pink));}
.lifebook nav.bottom{position:sticky;bottom:0;width:100%;z-index:30;background:rgba(253,251,255,.96);backdrop-filter:blur(6px);border-top:1px solid var(--line);display:flex;align-items:center;padding:8px 14px calc(8px + env(safe-area-inset-bottom));}
.lifebook .toc-btn{border:0;width:40px;height:40px;border-radius:50%;background:var(--soft);color:var(--ink);font-size:11.5px;font-family:'Gowun Dodum';display:flex;align-items:center;justify-content:center;flex:none;}
.lifebook #prog{flex:1;display:flex;justify-content:center;padding:0 16px;}
.lifebook .prog-track{position:relative;display:block;width:100%;max-width:170px;height:20px;border-radius:10px;background:var(--soft);overflow:hidden;}
.lifebook #progFill{position:absolute;inset:0 auto 0 0;width:0;border-radius:10px;background:#E7DDF8;transition:width .25s ease;overflow:hidden;}
.lifebook .prog-lab{position:absolute;top:0;bottom:0;left:0;right:0;display:flex;align-items:center;justify-content:center;font-size:11px;letter-spacing:.06em;}
.lifebook #progLabel{color:var(--ink);}
.lifebook #progLabelW{color:var(--ink);right:auto;}
.lifebook .arrow{border:0;width:40px;height:40px;border-radius:50%;background:var(--soft);color:var(--ink);font-size:18px;display:flex;align-items:center;justify-content:center;flex:none;margin-left:8px;}
.lifebook .arrow:disabled{color:#D8CCEE;background:#F8F4FD;}
.lifebook #tocSheet{position:fixed;inset:0;z-index:40;display:none;}
.lifebook #tocSheet.on{display:block;}
.lifebook .toc-bg{position:absolute;inset:0;background:rgba(0,0,0,.4);}
.lifebook .toc-panel{position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;max-height:72dvh;background:#FDFBFF;border-radius:18px 18px 0 0;overflow:auto;padding:10px 0 24px;box-shadow:0 -8px 32px rgba(74,58,114,.18);}
.lifebook .toc-handle{width:40px;height:3px;border-radius:2px;background:#D8CCEE;margin:6px auto 12px;}
.lifebook .toc-head{font-family:'Gowun Dodum';font-size:17px;padding:0 22px 8px;}
.lifebook .toc-panel ul{list-style:none;margin:0;padding:0;}
.lifebook .toc-panel li{display:flex;align-items:baseline;gap:10px;padding:12px 20px;background:#FDFBFF;}
.lifebook .toc-panel li.cur{background:#FDFBFF;}
.lifebook .toc-no{flex:none;font-size:10.5px;color:var(--ink);background:var(--soft);border-radius:999px;padding:3px 10px;letter-spacing:.04em;}
.lifebook .toc-t{font-family:'Do Hyeon','Gowun Dodum',sans-serif;font-size:15px;line-height:1.6;color:var(--ink);}
.lifebook .toc-panel li.cur .toc-no,.lifebook .toc-panel li.cur .toc-t{color:var(--pink);}
.lifebook footer.disc{padding:26px 20px 10px;text-align:center;font-size:11px;color:var(--mute);}
@keyframes lb-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
`;
