/**
 * 栏位类别
 * @param {object} config 参数
 * {
 *		value:false,
 *		name:false,
 *		className:'',
 *		nowrap:'nowrap',
 *		align:'center',
 *		onRender:_onRender
 *	}
 */
function GridColumn(config){
	var that = this;
	var _defConfig = {
		value:false,
		name:false,
		className:'',
		nowrap:'nowrap',
		align:'center',
		onRender:_onRender
	};

	$.extend(_defConfig,config);

	that.getValue=function(){
		return _defConfig.value;
	};
	that.getName=function(){
		return _defConfig.name;
	};
	that.getClassName=function(){
		return _defConfig.className;
	};
	that.getNowrap=function(){
		return _defConfig.nowrap;
	};
	that.getAlign=function(){
		return _defConfig.align;
	};

	that.onRender=_defConfig.onRender;
	
	/**
	 * 栏位值输出
	 * @param {object} record 一笔资料
	 * @param {string} value 该栏位值
	 */	
	function _onRender(record,value){
		return value?value:'';
	}
}

/**
 * 表单类别
 * @param {object} config 参数
 * {
 * 
 */
function Grid(config){
	var that = this;
	
	//表单范本
	var _gridTemplat = [
		'<div class="m-grid">',
	    	'<div class="m-grid-header">',
	    		'<span class="m-grid-header-title"></span>',
	            '<div class="m-grid-refresh flaticon-arrow"></div>',
	        '</div>',
	        '<div class="m-grid-table">',
		        '<table>',
					'<thead></thead>',
		        	'<tbody></tbody>',
		        '</table>',
	        '</div>',
	        '<div class="m-grid-footer">',
				'<div class="m-grid-pagination">',
			        '<div class="m-grid-pagination-left">',
						'<div class="m-grid-pagination-first flaticon-arrows-1"></div>',
						'<div class="m-grid-pagination-prev flaticon-arrow-1"></div>',
					'</div>',
					'<div class="m-grid-pagination-page">',
						'<span>第 </span>',
						'<input type="text" value="1">',
						'<span> 页</span>',
					'</div>',
					'<div class="m-grid-pagination-right">',
						'<div class="m-grid-pagination-next flaticon-arrow-1"></div>',
						'<div class="m-grid-pagination-last flaticon-arrows-1"></div>',
					'</div>',
				'</div>',
				'<div class="m-grid-footer-text"></div>',
	        '</div>',
	    '</div>',
	].join('');
	
	var _rowTemplate = '<tr class="m-grid-row">{0}</tr>';
	var _thTemplate = '<td nowrap="nowrap">{0}</td>';
	var _tdTemplate = '<td class="{0}" nowrap="{1}" align="{2}" >{3}</td>';
	var _arrowTemplate = '<td align="center"><div class="m-grid-row-open flaticon-search"></div></td>';
	var _indexTemplate = '<td nowrap="nowrap" align="center" >{0}</td>';
	
	var _rowContentTemplate = '<tr class="m-grid-row-content"><td colspan="{0}" >{1}</td></tr>';
	var _formTemplate = '<div class="m-grid-row-content-form">{0}</div>';
	var _formRowTemplate = [
		'<div class="m-grid-row-content-row">',
	        '<div class="m-grid-row-content-label">{0}</div>',
			'<div class="m-grid-row-content-text">{1}</div>',
		'</div>'
	].join('');
	
	var _footerText = '共{0}页，总共{1}笔';
	
	var _$grid = false,_$thead = false,_$tbody = false,_$header = false,_$footer = false,_$pageInput = false;

	//预设参数
	that.config = {
		appendId:false,
		title:false,
		dataUrl:false,
		showIndex:false,
		showMore:true,
		showRefresh:true,
		size:10,
		columnModel:{
			recordColumns:false,
			contentColumns:false
		},
		getParam:false,
		onBeforeLoad:false,
		onLoad:false,
		onRowClick:false
	}
	
	$.extend(that.config,config);

	//预设参数
	var _defStore = {
		number:1,
		content:[],
		totalElements:0
	};
	var _store = {};
	
	var _defParam = {
		number:1,
		content:[],
		totalElements:0
	};
	
	var _param = {};
	
	that.init = _init;
	that.load = _load;
	that.reload = _reload;
	that.refresh = _refresh;
	that.gridEl = false;
	
	//初始化
	
	function _init(){
		//element 不存在
		if(!that.config.columnModel.recordColumns){
			alert('尚未设定 column！');
			return;
		}
		var $appendEl = false;
		if(that.config.appendId){
			$appendEl = $('#'+that.config.appendId);
		}
		
		if(!_$grid){
			_$grid = $(_gridTemplat);
			_$thead = _$grid.find('thead');
			_$tbody = _$grid.find('tbody');
			_$header = _$grid.find('.m-grid-header-title');
			_$footer = _$grid.find('.m-grid-footer-text');
			_$pageInput = _$grid.find('.m-grid-pagination-page').find('input');
			NumberInput(_$pageInput[0]);
			
			//设定标头
			if(that.config.title){
				_$header.html(that.config.title);
			}
			
			//生成thead
			var column;
			var columnArray = [];
			var l = that.config.columnModel.recordColumns.length;
			if(that.config.showMore){
				columnArray.push(String.format(_thTemplate,''));
			}
			if(that.config.showIndex){
				columnArray.push(String.format(_thTemplate,'序'));
			}
			
			for(var i = 0;i<l;i++){
				column = that.config.columnModel.recordColumns[i];
				columnArray.push(String.format(_thTemplate,column.getName()));
			}
			_$thead.html('<tr>'+columnArray.join('')+'</tr>');
			
			//隐藏刷新按钮
			if(!that.config.showRefresh){
				_$grid.find('.m-grid-refresh').css('display','none');
			}
			column = columnArray = null;
			// 设定tbody 无资料
			_setTbodyNoData();
			that.gridEl = _$grid;
			if($appendEl){
				$appendEl.append(_$grid);
			}
		}
		$.extend(_store,_defStore);
		$.extend(_param,_defParam);
		_initEvent();
		
		return _$grid;
	}
	
	/**
	 * 初始化事件
	 */
	function _initEvent(){
		_$grid.find('.m-grid-refresh').click(_refresh);
		_$grid.find('.m-grid-pagination-first').click(_first);
		_$grid.find('.m-grid-pagination-prev').click(_prev);
		_$grid.find('.m-grid-pagination-next').click(_next);
		_$grid.find('.m-grid-pagination-last').click(_last);
		//页码输入查询
		_$pageInput.change(_setPage);
	}

	/**
	 * 
	 * 初始化开启详细资料
	 * 
	 */
	function _initOpenEvent(){
		if(!that.config.columnModel.contentColumns)return;
		var $rows = _$tbody.find('.m-grid-row');
		$.each($rows,function(key,value){
			$rows.eq(key).bind('click',{record:_store.content[key]},_rowOnClick);
		});
		$rows = null;
	}
	
	/**
	 * 列单击
	 * @param e Event
	 */
	function _rowOnClick(e){
		e.stopPropagation();
		if(that.config.onRowClick){
			that.config.onRowClick.apply(this,[e,e.data.record]);
		}
		var $that = $(this);
		if($that.hasClass('active')){
			$that.removeClass('active');
		}else{
			_$tbody.find('.m-grid-row').removeClass('active');
			$that.addClass('active');
		}
		$that = null;
	}
	
	/**
	 * 查询资料
	 * @param {object} form data
	 */
	function _load(){
		if(that.config.onBeforeLoad){
			that.config.onBeforeLoad();
		}
		_setTbodyNoData('<div class="load-circle"></div>');
		var _formData = that.config.getParam? that.config.getParam():{};
		$.extend(_formData,_param);
		_formData['size'] = that.config.size;
		
		//设定页码
		_$pageInput.val(_param.number);
		
		webManage.getLoader().open('查询中');
		_formData.number--;
		//查询
		webManage.ajax({
			url:that.config.dataUrl,
			param:_formData,
			type:'GET',
			callback:function (result) {
				webManage.getLoader().close();
				if(result.success){
					$.extend(_store,result);
					_param.totalElements = result.totalElements;
					if(_param.totalElements==0){
						_setTbodyNoData('无资料');
						_param.number = 1;
					}else{
						_setTbodyData();
						_param.number = result.number+1;
					}
				}else{
					_setTbodyNoData(result.message);
					_param.number = 1;
				}
				_$pageInput.val(_param.number);
				if(that.config.onLoad){
					that.config.onLoad(result);
				}
			}
		});
	}

	function _reload(){
		$.extend(_store,_defStore);
		$.extend(_param,_defParam);
		_load();
	}
	
	/**
	 * 第一页
	 */
	function _first(e){
		e.stopPropagation();
		if(_param.number<=1)return;
		_param.number = 1;
		_load();
	}

	/**
	 * 上一页
	 */
	function _prev(e){
		e.stopPropagation();
		if(_param.number<=1)
			return;
		
		_param.number--;
		_load();
	}
	/**
	 * 下一页
	 */
	function _next(e){
		e.stopPropagation();
		if(_param.number==_gettotalElementsPage())return;
		_param.number++;
		_load();
		
	}
	/**
	 * 最后一页
	 */
	function _last(e){
		e.stopPropagation();
		var i = _gettotalElementsPage();
		if(_param.number==i)return;
		_param.number = i;
		_load();
	}

	/**
	 * 刷新
	 */
	function _refresh(e){
		e.stopPropagation();
		_load();
	}
	
	/**
	 * 取得总页数
	 */
	function _gettotalElementsPage(){
		if(_param.totalElements<1||that.config.size<1){
			return 1;
		}
		return Math.ceil(_param.totalElements/that.config.size);
	}
	
	/**
	 * 设定页码
	 */
	function _setPage(){
		if(_$pageInput.val()==0){
			_$pageInput.val(1)
		}
		if(_$pageInput.val()){
			delayAction('input query',300,function(){
				var i = _gettotalElementsPage();
				if(_param.number==_$pageInput.val())return;
				if(i<=_$pageInput.val()){
					_param.number = i;
				}else{
					_param.number = _$pageInput.val();
				}
				_load();
			});
		}
	}
	
	/**
	 * 写入资料
	 */
	function _setTbodyData(){
		var row;
		var rows = [];
		var cols = [];
		var index = (_store.number) * that.config.size+1;
		var colspan = that.config.columnModel.recordColumns.length;
		var moreTd = '';
		var indexTd = '';
		if(that.config.showMore){
			moreTd = _arrowTemplate;
			colspan++;
		}
		if(that.config.showIndex){
			indexTd = _indexTemplate;
			colspan++;
		}
		
		var record;
		var column;
		for(var i = 0,length = _store.content.length;i<length;i++,index++){
			cols = [];
			record = _store.content[i];
			cols.push(moreTd);
			cols.push(String.format(indexTd,index));
			for(var j = 0,length2 = that.config.columnModel.recordColumns.length;j<length2;j++){
				column = that.config.columnModel.recordColumns[j];
				cols.push(String.format(_tdTemplate,column.getClassName(),column.getNowrap(),column.getAlign(),column.onRender(record,record[column.getValue()])));
			}
			rows.push(String.format(_rowTemplate,cols.join('')));
			
			if(that.config.columnModel.contentColumns){
				cols = [];
				for(var j = 0,length2 = that.config.columnModel.contentColumns.length;j<length2;j++){
					column = that.config.columnModel.contentColumns[j];
					cols.push(String.format(_formRowTemplate,column.getName(),column.onRender(record,record[column.getValue()])));
				}
				rows.push(String.format(_rowContentTemplate,colspan,String.format(_formTemplate,cols.join(''))));
			}
		}
		_$tbody.html(rows.join(''));
		//页数说明
		_$footer.html(String.format(_footerText,Math.ceil(_store.totalElements/that.config.size),_store.totalElements));
		_initOpenEvent();
	}
	
	/**
	 * 设定tbody 无资料
	 * @param {string} text
	 */
	function _setTbodyNoData(text){
		text = text?text:'无资料';
		var l = that.config.columnModel.recordColumns.length;
		if(that.config.showIndex){
			l++;
		}
		if(that.config.showMore){
			l++;
		}
		_$tbody.html(String.format('<tr><td colspan="{0}" algin="center" style="position: relative;padding: 2em;">{1}</td></tr>',l,text));
		//页数说明
		_$footer.html(String.format(_footerText,1,0));
	}
}