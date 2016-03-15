/*
    folkdown version 2.0.1
    2015.9.25.
*/

/*
希望
・・段組み自由のテーブル
・検索
*/

/*
文法

これらの記号は文章の中で使えます。内側に改行が入らないようにしてください。
  [  ]     ... ファイル名を囲む事で画像を表示。
  [::]     ... [ファイル名::キャプション]で画像を表示。
  [[]]     ... [[ファイル名]]でリンク。
  *   *    ... 囲まれた部分を太字で表示。
  &br      ... 行中の改行。主に引用(>)文章を改行したい時に使う。
  ..       ... custom.cssで定義したクラスを追加します。サンプルとして..redが用意されています

これらの記号は行を修飾するため、必ず行の始めに書きます。
  >     ... 特定の文書やページからの引用。
  >>    ... 引用元情報。アドレス、タイトル等
  //    ... コメントアウト。記事上では表示されない。
  #     ... 大見出し。後ろに来るテキストは格納する事ができる。
  ##    ... 中見出し。
  ###   ... 小見出し。メニューには表示されない。
  -     ... 番号なしリスト。レベル1。
  --    ... 番号なしリスト。レベル2。レベルはこれ以上増やすこともできる。

これらの記号は行を修飾するため、少なくとも行の始めと最後に書きます。
  |     ... テーブル。同記号で囲んだ部分はテーブルセルになる。
  |~|   ... 左のテーブルと結合（未実装）
  |^|   ... 上のテーブルと結合（未実装）

これらの記号は単体で機能するため、これだけで一行にしてください。
  &menu ... メニューを生成。大見出しと中見出しにジャンプできる。
  @     ... @ファイル名 で特定の記事に自動的にジャンプします。リダイレクト用なのでこれ以外の内容は書かない事を推奨。

これらの記号は
  {  }  ... 格納ボックス。囲まれた部分は非表示になるが、横に出る+のボタンを押すと表示される。中で#または##を使うとおかしくなるので使わない事。

*/

/*
注意事項

  使うページには必ずjquery.jsファイルを置いてください。

*/

if(window===undefined){var window=0;}
if($===undefined){var $=0;}
if(document===undefined){var document=0;}

function createNavigate(selector,links){
	$(selector).append('<ul>'+links.map(function(d){
		var e=d.split('>'),
			f=d.indexOf('>')>0?e[1]:'';
		return '<li><a href="'+f+'">'+e[0]+'</a></li>';
	}).join('')+'</ul>');
}

function pageParse(selector,fileName,spin){//spinがtrueにあたる場合、縦書き印刷になる
	var pageName=(window.location.search?window.location.search.substring(1,window.location.search.length):fileName);
	var file='./document/'+pageName+'.txt';
	var httpObj = $.ajax(
		{
			url:file,
			dataType:'text',
			success:function(){
				var content = httpObj.responseText;
				var ju = content.match(/@[^\s#-\/\{\}\[\]:\&\@><\|]+/);
				if (ju !== null) {//    @があれば対象の記事にジャンプ
					window.location.href = add(ju[0].replace(/@/,''));
				}
				else{
					var sectionIndex=[],//大見出しの内容を格納。メニュー表示用
						headlineIndex=[],//中見出しの内容を格納。メニュー表示用
					
						level=0,//リストのインデントレベルを格納
						tableEdit=false,//テーブルの途中であればtrue
					
						putl=[],//<li></li>を入れる場所を格納
						puti=[],//<ul>を入れる場所を格納
						puto=[],//</ul>を入れる場所を格納

						tabr=[],//<tr></tr>を入れる場所を格納
						tabi=[],//<table>を入れる場所を格納
						tabo=[],//</table>を入れる場所を格納

						splitedContent=content.split("\n");//行ごとに分割してリスト化したcontent
					
					var editedContent=splitedContent.map(function(d,i){
						var pre_level=level,//前の行のインデントレベル
							output;
						level=0;
						
						if(d.indexOf("###")===0){//小見出し
							output="<h4>"+d.substr(3)+"</h4>\n";
						}

						else if(d.indexOf("##")===0){//中見出し
							var h2Text=d.substr(2),
								headlineIndexLength=headlineIndex.length,
								index;//セクション中何番目の中見出しかを格納。メニュー表示用
							if(headlineIndexLength===0){//セクションが始まっていなければメニュー用の格納はしない
								index=$('h3').length;
							}else{
								index=headlineIndex[headlineIndexLength-1].length;
								headlineIndex[headlineIndexLength-1].push(h2Text);
							}
							output="<h3 id='"+sectionIndex.length+"-"+(index+1)+"'>"+h2Text+"</h3>\n";
						}

						else if(d.indexOf("#")===0){
							var h1Text=d.substr(1),
								sectionIndexLength=sectionIndex.length+1;
							sectionIndex.push(h1Text);
							headlineIndex.push([]);
							output="</div><hr/><h2 id='h"+sectionIndexLength+"' value='"+sectionIndexLength+"'>"+h1Text+"</h2><div id='"+sectionIndexLength+"'>";
						}

						else if(d.indexOf("//")===0){
							output="<!--"+d.substr(2)+"-->";
						}

						else if(d.indexOf(">>")===0){
							output="<i>"+d.substr(2)+"</i>\n";
						}

						else if(d.indexOf(">")===0){
							output="<blockquote>"+d.substr(1)+"</blockquote>\n";
						}

						else if(d.indexOf("<")===0){
							output="<p class='balloon'>"+d.substr(1)+"</p>\n";
						}

						else if(d.indexOf(":")===0){
							output="<p class='indent'>"+d.substr(1)+"</p>";
						}

						else if(d.indexOf("-")===0){
							putl.push(i);
							for(var j=d;j.indexOf("-")===0;j=j.slice(1)){
								level++;
								d=j;
							}
							output=d.slice(1);
						}
						else if(d.indexOf("|")===0){
							tabr.push(i);
							var split_list=d.split("|");
							split_list.shift();split_list.pop();
							split_list=split_list.map(function(e){
								return "<td>"+e+"</td>";
							});
							if(!tableEdit){
								tabi.push(i);
								tableEdit=true;
							}
							output=split_list.join("");
						}else{
							//#TODOバックスラッシュがある文字を一旦置換する処理
							
							

							if(tableEdit){
								tabo.push(i);
								tableEdit=false;
							}
							if(d){
								console.log(d);
								output='<p>'+d+'</p>';
							}
							else{
								return '';
							}
							
						}
						if(level-pre_level>0){//前の行よりもインデントレベルが高い場合
							for(var k=0;k<level-pre_level;k++){puti.push(i);}
						}
						else if(level-pre_level<0){
							for(var l=0;l<pre_level-level;l++){puto.push(i);}
						}
						else{}
						
						var bolding=output.split('*');
						
							output=bolding.map(function(d,i){
								if(i===0){return d;}
							return (i%2===1?"<b>":"</b>")+d;}).join('');

						
						return output
						.replace(/\[\[(\S+)\>(\S+)\]\]/g,"<a href='$2'>$1</a>" )
						.replace(/\[\[(\S+)\]\]/g,"<a href=''>$1</a>" )
					.replace(/\[([\w\.\/]+)\:\:(.*)\]/g,'<a class="image" href="./image/$1" data-title="$2" data-lightbox="image"><img src="./image/$1" width=160 alt=""/></a>')
					.replace(/\[([\w\.\/]+)\]/g,'<a class="image" href="./image/$1" data-lightbox="image"><img src="./image/$1" width=160 alt=""/></a>')
					.replace(/===/g,"<hr/>" )
					.replace(/\.\.(\w+)/g,'<span class="$1"></span>')
					.replace(/\&br/g,"<br/>" );
					});
					
					if(level>0){
						for(var j=0;j<level;j++){editedContent.push("</ul>");}
					}
					putl.map(function(d){editedContent[d]  ="<li>"+editedContent[d]+"</li>";});
					puti.map(function(d){editedContent[d]  ="<ul>"+editedContent[d];});
					puto.map(function(d){editedContent[d-1]=editedContent[d-1]+"</ul>";});

					if(tableEdit){
						editedContent.push("</table>");
					}
					tabr.map(function(d){editedContent[d]="<tr>"+editedContent[d]+"</tr>";});
					tabi.map(function(d){editedContent[d]="<table border='2'>"+editedContent[d];});
					tabo.map(function(d){editedContent[d-1]=editedContent[d-1]+"</table>";});
					editedContent=editedContent.join("");

					//メニュー生成
					var menu="<div id='menu'>";
					sectionIndex.map(function(d,i){
						menu=menu+"<p><a href='#h"+(i+1)+"'>"+(i+1)+"."+d.replace(/[\n\r]/,"")+"</a><br/>";
						if(headlineIndex.length>i){ 
							headlineIndex[i].map(function(e,j){
								menu=menu+"<span class='indent'><a class='subMenu' href='#"+(i+1)+"-"+(j+1)+"'>"+(i+1)+"-"+(j+1)+"."+e.replace(/[\n\r]/,"")+"</a></span><br/>";
							});
						}
						menu+="</p>";
					});
					menu+="</div>";
					editedContent=editedContent.replace(/\&menu/g,menu);

					editedContent=editedContent.replace(/\{(.+)\}/g,"<div class='stroage'><span class='sButton'>+</span><div class='stroageContent'>$1</div></div>" )
					.replace(/<p><div/g,'<div').replace(/div><\/p>/g,'div>');


					$(selector).html("<h1>"+decodeURI(pageName)+"</h1><div>"+editedContent+"</div>");
				}
				if(spin){//縦書きの場合
					$("p").children().andSelf().contents().each(function(){rotate(this);});
					$("h2").children().andSelf().contents().each(function(){rotate(this);});
					$("h4").children().andSelf().contents().each(function(){rotate(this);});
					$("li").children().andSelf().contents().each(function(){rotate(this);});
				}
			},
			error:function(){
				alert("ファイルがありません");
			},
		});
}

function rotate(t){

	if (t.nodeType == 3) {
		var $this = $(t);

		$this.replaceWith($this.text().replace(/([^A-Za-z_（）。、「」＝ー\(\)])/g, "<span class='pq'>$&</span>").replace(/([。、])/g, "<span class='mq'>$&</span>"));


	}

}

function submitStop(e){//submitをエンターで起こらないように
	if (!e){e = window.event;}
	if(e.keyCode == 13){return false;}
}
function add(text){//getするための関数
	return window.location.pathname.split("/").pop()+"?"+text;
}

function jump(){
	window.location.href=add(document.FORM.box.value);
	document.FORM.box.value="";
}

$(document).on("click","a",function(){
	var $this=$(this),
		linkIdentifier=($this.attr("href"))?$this.attr("href"):$this.text();
	
	if(linkIdentifier.match(/[\/\.]/)){
		$this.attr("href",linkIdentifier);
	}else{
		$this.attr("href",add(linkIdentifier));
	}
});


$(document).on("click","h2",function(){
	$("#"+$(this).attr("value")).slideToggle();



});


//参考:http://syncer.jp/jquery-to-top-button
$(function(){
	//ボタン[id:page-top]を出現させるスクロールイベント
	$(window).scroll(function(){
		//最上部から現在位置までの距離を取得して、変数[now]に格納
		var now = $(window).scrollTop();

		if(now > 800){
			//[#page-top]をゆっくりフェードインする
			$('#page-top').fadeIn('slow');
			//それ以外だったらフェードアウトする
		}else{
			$('#page-top').fadeOut('slow');
		}
	});

	//ボタン(id:move-page-top)のクリックイベント
	$('#move-page-top').click(function(){
		//ページトップへ移動する
		$('html,body').animate({scrollTop:0},'slow');
	});
});

$(document).on("click",".sButton",function(){
	$(this).next(".stroageContent").slideToggle();
});