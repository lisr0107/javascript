Boss = {};
Ext.namespace('Boss.Ext');
/**
 * @class Boss.Ext.PagingToolBar
 * @extends Ext.PagingToolbar
 * 扩展原有的PagingToolbar，增加分页信息更新功能
 */
Boss.Ext.PagingToolBar = Ext.extend(Ext.PagingToolbar,{
	constructor:function(ds,cfg){
		//每页显示条数
		var pagenum = new Ext.form.NumberField({
			width:50,
			minValue:10,
			maxValue:1000,
			allowNagative:false,
			allowDecimals:false,
			value:cfg.pageSize
		});
		
		Boss.Ext.PagingToolBar.superclass.constructor.call(this,{
			pageSize:cfg.pageSize,
			store:ds,
//			style: 'background-color:#F7F5F4; background-image:url();', 
			displayInfo:true,
			displayMsg:bundle.getMsg('com.messages.paging.display'),//'显示{0}条到{1}条记录，共{2}条',
			emptyMsg:bundle.getMsg('com.messages.paging.empty')//'没有记录',
			//beforePageText:'第&nbsp;',
			//afterPageText:'&nbsp;/&nbsp;{0}&nbsp;页'
		});
		
//		this.insert(10,{xtype:'label',html:'&nbsp;&nbsp;条&nbsp;'});
//		this.insert(10,pagenum);
//		this.insert(10,{xtype:'label',html:'&nbsp;&nbsp;&nbsp;每页显示:&nbsp;&nbsp;',padding:3});
//		pagenum.on('change',function(){
//			this.pageSize = pagenum.value;
//		});
	},
	/**
	 * 更新分页条中的分页信息
	 * @param {integer} recordCount 记录数
	 */
	updateInfo : function(recordCount){
        if(this.displayItem){
            var count = this.store.getCount();
            var msg = count == 0 ?
                this.emptyMsg :
                String.format(
                    this.displayMsg,
                    this.cursor+1, this.cursor+count, recordCount
                );
            this.displayItem.setText(msg);
            
            var ipages = Math.ceil(recordCount/this.pageSize);
            
            if (isNaN(ipages)){
            	
            	ipages = 0;
            	
            }
            
            this.afterTextItem.setText(String.format(this.afterPageText, ipages));
            //设置翻页按钮是否可用
            var ipage = this.getPageData().activePage;
            this.first.setDisabled(ipage <= 1);
        	this.prev.setDisabled(ipage <= 1);
        	this.next.setDisabled((ipages == ipage) || (ipages <= 0));
        	this.last.setDisabled((ipages == ipage) || (ipages <= 0));
        	this.refresh.enable();
            
        }
    }
});

/**
 * @class Boss.Ext.GridView
 * @extends Ext.grid.GridView
 * 实现Boss.Ext.Grid中的文本选择功能，Grid在列中渲染HTML组件时如编辑框，
 * 通过指定Grid的view 为Boss.Ext.GridView，可对编辑框进行鼠标选择操作。
 * 需要加入css：
 * 	<style type="text/css">  
 *  	.x-selectable, .x-selectable * {  
 *      	-moz-user-select: text!important;  
 *      	-khtml-user-select: text!important;  
 *  	}  
 *	</style> 
 */
Boss.Ext.GridView = Ext.extend(Ext.grid.GridView,{});

if (!Boss.Ext.GridView.prototype.templates) {
    Boss.Ext.GridView.prototype.templates = {};
}

Boss.Ext.GridView.prototype.templates.cell = new Ext.Template(
     '<td class="x-grid3-col x-grid3-cell x-grid3-td-{id} x-selectable {css}" style="{style}" tabIndex="0" {cellAttr}>',
     '<div class="x-grid3-cell-inner x-grid3-col-{id}" {attr}>{value}</div>',
     '</td>'
);

/**
 * @class Boss.Ext.GroupingView
 * @extends Ext.grid.GroupingView
 * 用于实现GridPanel的总计功能
 * @author LXB
 * @version 1.0.1
 */
Boss.Ext.GroupingView = Ext.extend(Ext.grid.GroupingView,{
	constructor:function(cfg){
		Ext.apply(this, cfg);
        Boss.Ext.GroupingView.superclass.constructor.call(this);
        if(!this.rowTpl){
            this.rowTpl = new Ext.Template(
                '<div class="x-grid3-summary-row" style="{tstyle}">',
                '<table class="x-grid3-summary-table" border="0" cellspacing="0" cellpadding="0" style="{tstyle}">',
                    '<tbody><tr>{cells}</tr></tbody>',
                '</table></div>'
            );
            this.rowTpl.disableFormats = true;
        }
        this.rowTpl.compile();

        if(!this.cellTpl){
            this.cellTpl = new Ext.Template(
                '<td class="x-grid3-col x-grid3-cell x-grid3-td-{id} {css}" style="{style}">',
                '<div class="x-grid3-cell-inner x-grid3-col-{id}" unselectable="on">{value}</div>',
                "</td>"
            );
            this.cellTpl.disableFormats = true;
        }
        this.cellTpl.compile();
	},
	renderSummary : function(o, cs,bsum){
        cs = cs || this.view.getColumnData();
        var cfg = this.grid.getColumnModel().config,
            buf = [], c, p = {}, cf, last = cs.length-1;
        for(var i = 0, len = cs.length; i < len; i++){
            c = cs[i];
            cf = cfg[i];
            p.id = c.id;
            p.style = c.style;
            p.css = i == 0 ? 'x-grid3-cell-first ' : (i == last ? 'x-grid3-cell-last ' : '');
            if(cf.summaryType || cf.summaryRenderer){
                p.value = (cf.summaryRenderer || c.renderer)(o.data[c.name], p, o,bsum);
            }else{
                p.value = '';
            }
            if(p.value == undefined || p.value === "") p.value = "&#160;";
            buf[buf.length] = this.cellTpl.apply(p);
        }

        return this.rowTpl.apply({
            tstyle: 'width:'+this.getTotalWidth()+';',
            cells: buf.join('')
        });
    },
    calculate : function(rs, cs){
        var data = {}, r, c, cfg = this.grid.getColumnModel().config, cf;
        for(var j = 0, jlen = rs.length; j < jlen; j++){
            r = rs[j];
            for(var i = 0, len = cs.length; i < len; i++){
                c = cs[i];
                cf = cfg[i];
                if(cf.summaryType){
                    data[c.name] = Ext.ux.grid.GroupSummary.Calculations[cf.summaryType](data[c.name] || 0, r, c.name, data);
                }
            }
        }
        return data;
    },
    //增加合计
    doHeJi:function(buf,cs, ds){
        var data1 = this.calculate(ds.getRange(), cs);
        buf.push('</div>', this.renderSummary({data: data1}, cs,1), '</div>');
    },
	// 重写doRender
    doRender : function(cs, rs, ds, startRow, colCount, stripe){
        if(rs.length < 1){
            return '';
        }

        if(!this.canGroup() || this.isUpdating){
            return Ext.grid.GroupingView.superclass.doRender.apply(this, arguments);
        }

        var groupField = this.getGroupField(),
            colIndex = this.cm.findColumnIndex(groupField),
            g,
            gstyle = 'width:' + this.getTotalWidth() + ';',
            cfg = this.cm.config[colIndex],
            groupRenderer = cfg.groupRenderer || cfg.renderer,
            prefix = this.showGroupName ? (cfg.groupName || cfg.header)+': ' : '',
            groups = [],
            curGroup, i, len, gid;

        for(i = 0, len = rs.length; i < len; i++){
            var rowIndex = startRow + i,
                r = rs[i],
                gvalue = r.data[groupField];

                g = this.getGroup(gvalue, r, groupRenderer, rowIndex, colIndex, ds);
            if(!curGroup || curGroup.group != g){
                gid = this.constructId(gvalue, groupField, colIndex);
                // if state is defined use it, however state is in terms of expanded
                // so negate it, otherwise use the default.
                this.state[gid] = !(Ext.isDefined(this.state[gid]) ? !this.state[gid] : this.startCollapsed);
                curGroup = {
                    group: g,
                    gvalue: gvalue,
                    text: prefix + g,
                    groupId: gid,
                    startRow: rowIndex,
                    rs: [r],
                    cls: this.state[gid] ? '' : 'x-grid-group-collapsed',
                    style: gstyle
                };
                groups.push(curGroup);
            }else{
                curGroup.rs.push(r);
            }
            r._groupId = gid;
        }

        var buf = [];
        for(i = 0, len = groups.length; i < len; i++){
            g = groups[i];
            this.doGroupStart(buf, g, cs, ds, colCount);
            buf[buf.length] = Ext.grid.GroupingView.superclass.doRender.call(
                    this, cs, g.rs, ds, g.startRow, colCount, stripe);

            this.doGroupEnd(buf, g, cs, ds, colCount);
        }
        //加入合计
        this.doHeJi(buf, cs, ds);
        return buf.join('');
        
    }
}); 

/**
 * @class Boss.Ext.Grid
 * @extends Ext.grid.GridPanel
 * 实现对Ext.grid.GridPanel的封装，主要实现功能：<br>
 * 1.统一data.store、record和Grid的操作<br>
 * 2.提供基本的增加、删除、修改操作的处理<br>
 * <pre><code>
 * var cfgSrv = {
 *			height : 300,
 *			title : bundle.getMsg('prodadmin.service.servicelist'),//'服务列表',
 *			header : false,
 *			page : true,
 *			mulselect : false,
 *			root : 'serviceList',
 *			pageSize : 10,
 *			fireRowClick : true,
 *			defaultSelect : true,
 *			url : 'serviceDefinitionAction.qryService.query.action'
 *		};
 *		cfgSrv.columns = [{
 *					header : '服务类别',
 *					dataIndex : 'servType',
 *					width : 100,
 *					bShow : false,
 *					renderer:function(value){
 *						return Dic.getItemName('service_type',value);
 *					}
 *				}, {
 *					header : '服务名称',
 *					dataIndex : 'servName',
 *					width : 100
 *				}
 *				}];
 *		cfgSrv.hiddenColumns = [{
 *					header : 'note',
 *					dataIndex : 'note',
 *					width : 100
 *		}];
 *
 *		cfgSrv.tbar = [{
 *					text : bundle.getMsg('prodadmin.service.newservice'),//'新增服务',
 *					width : 75,
 *					iconCls:'btn-add',
 *					handler : function() {
 *						Instance.fireEvent('addService')
 *					}
 *				}];
 *		//1.创建Grid
 *		var gridSrv = new Boss.Ext.Grid(cfgSrv);
 *		//2.查询数据
 *		gridSrv.loadData({start:0,limit:20,servType:1});
 *		//3.获取当前记录
 *		var record = gridSrv.getActiveRecord();
 *		//4.新建记录保存后插入记录
 *		var rec = new Ext.data.Record({
 *							id:id,
 *							servName:'',
 *							servType:'',
 *							orgId:'',
 *							twoLevelFlag :'',
 *							note :''
 *						});
 *		gridSrv.insertRecord(rec);
 *		//5.修改弹出窗体提交后更改本地的Record
 *		var formvalue = editFrm.getForm().getValues();
 *		gridSrv.updateRecord(formvalue);
 *		//6.删除选中的记录
 *		gridSrv.deleteSelected
 * </code></pre>
 */
Boss.Ext.Grid= Ext.extend(Ext.grid.GridPanel,{
	/**
	 * 用于记录修改日志（主要用于弹出窗口中的多选列表的选中日志）,需要先调用setUpdLog，才能正确获得此值
	 * @type String
	 * @property
	 */
	updLog : '',
	
	/**
	 * 日志Json对象，实现增加属性进而增加日志信息的功能，需要先调用setUpdLog，<br>
	 * 然后通过Ext.encode([logJson])获取日志进行提交
	 * @type Json 
	 */
	logJson :{},
	
	Fields : null,
	
	/**
	 * 构造函数
	 * @param {} cfg 配置项，格式：{	<B>Data</B>:本地数据,<br>
	 * 										<B>url</B>:远程数据请求URL<br>
	 * 										<B>root</B>:  填充数据项，通常对应Java一个List对象<br>
	 * 										<B>total</B>: 记录集行数,参考Ext.data.JsonReader<br>
	 * 										<B>columns</B>:表格列，格式参考Ext.grid.ColumnModel,增加type项<br>
	 * 										<B>header</B>:boolean,  //标题是否可见<br>
	 * 									  	<B>title</B>:string,	//标题<br>
	 * 										<B>page</B>:boolean,   //是否分页<br>
	 * 										<B>pageSize</B>://每页显示条数<br>
	 * 										<B>mulselect</B>:boolean, //是否允许多选，ture:多选框，false：单选框，不定义：不渲染选择框列<br>
	 * 										<B>hiddenColumns</B>:隐藏列，用于store存储列表外的其他数据<br>
	 * 										<B>groupField</B>:'',//分组显示字段，仅支持一列分组，当此属性指定时，进行分组，列对象中增加：summaryType：'sum','average','count','max','min'<br>
	 * 										<B>textSelect</B>:boolean //表格中的文本是否可选，当通过渲染html的输入框到列时，设置为ture，输入框中的内容可通过鼠标选择，否则不能选择导致操作部方便<br>
	 * 										<B>tbar</B>：工具栏<br>
	 * 										<B>rownum</B>:boolean,//是否显示行号
	 * 										<B>defaultSelect</B>：默认选择，用于在装载数据后自动选择第一行<br>
	 * 										<B>fireRowClick</B>：是否出发单击行事件，用于默认选择第一行后，自动级联查询从表内容<br>
	 * 									  }
	 */
	constructor:function(cfg){
		var summary;
		var gview;
		this.cfg = cfg;
		if (cfg.textSelect){
			gview = new Boss.Ext.GridView();
		}
		this.recordCount = 0;
		if ((cfg.groupField != undefined)&&(cfg.groupField != '')){
			summary = new Ext.ux.grid.GroupSummary();
			gview = new Boss.Ext.GroupingView({
	            forceFit: true,
	            showGroupName: false,
	            enableNoGroups: false,
				enableGroupingMenu: false,
	            hideGroupedColumn: true,
	            columnsText : bundle.getMsg('com.label.showcolumns'),//'显示列',
				scrollOffset : 30,
				sortAscText : bundle.getMsg('com.label.asc'),//'升序',
				sortDescText : bundle.getMsg('com.label.desc')//'降序'
	        });
	        cfg.columns[1].summaryRenderer = function(v, params, data,bsum){
	        	if (bsum != undefined){
	        		return ((v >= 1) ? '总计(' + v +' 项)' : '小计(0 项)');
	        	} else {
            		return ((v >= 1) ? '小计(' + v +' 项)' : '小计(0 项)');
	        	}
            };
            cfg.columns[1].summaryType = 'count';
		};
		
		var fields = new Array();
		
		for(var i =0;i<cfg.columns.length;i++){
			var AJason = cfg.columns[i];
			if (AJason.mapping != undefined){
				fields.push({name:AJason.dataIndex,mapping:AJason.mapping});
			} else {
				fields.push({name:AJason.dataIndex});
			}
		};
		
		
		
		//加入隐藏列，到Store
		if ( (cfg.hiddenColumns != undefined) && (cfg.hiddenColumns != null) ){
			this.hiddenColumns = cfg.hiddenColumns;
			for(var i =0;i<cfg.hiddenColumns.length;i++){
				var BJason = cfg.hiddenColumns[i];
				if (BJason.mapping != undefined){
					fields.push({name:BJason.dataIndex,mapping:BJason.mapping});
				} else {
					fields.push({name:BJason.dataIndex});
				}
			};
		};
		
		var ds;
		var Recorder = new Ext.data.Record.create(fields);
		
		this.Fields = fields;
		
		
		if((cfg.url != undefined) && (cfg.url != ''))
		{
			//分组功能
			if ((cfg.groupField != undefined)&&(cfg.groupField != '')){
				ds = new Ext.data.GroupingStore({
					proxy:new Ext.data.HttpProxy({url:cfg.url}),
  	 				reader: new Ext.data.JsonReader({
							root:cfg.root,
							totalProperty:cfg.total},
							Recorder),
					groupField: cfg.groupField
				});
			} else {
				ds = new Ext.data.Store({
					proxy:new Ext.data.HttpProxy({url:cfg.url}),
  	 				reader: new Ext.data.JsonReader({
							root:cfg.root,
							totalProperty:cfg.total},
							Recorder)
				});
			}
    	} else {
    		if ((cfg.groupField != undefined)&&(cfg.groupField != '')){
    			ds = new Ext.data.GroupingStore({
					proxy:new Ext.data.MemoryProxy(cfg.data),
					reader:new Ext.data.ArrayReader({},fields),
					groupField: cfg.groupField
				});
    		} else {
				ds = new Ext.data.Store({
					proxy:new Ext.data.MemoryProxy(cfg.data),
					reader:new Ext.data.ArrayReader({},fields)
				});
			}
			ds.load();
		};
	
		var sm;//选择模型
		if(cfg.sm){
			sm = cfg.sm;
		}else if (cfg.mulselect == true){
			sm = new Ext.grid.CheckboxSelectionModel({checkOnly:false});
			cfg.columns.unshift(sm);
		} else if (cfg.mulselect == false) {
			sm = new Boss.Ext.RadioBoxSelectionModel();//new Ext.grid.RowSelectionModel({singleSelect:true});
			cfg.columns.unshift(sm);
		} else {
			sm = new Ext.grid.RowSelectionModel({singleSelect:true});
		}
		
		if (cfg.rownum){
			cfg.columns.unshift(new Ext.grid.RowNumberer({header:bundle.getMsg('com.label.serialnumber'),width:35}));//行号
		}
		//列标题居中
		for(var c=0,ic=cfg.columns.length;c<ic;c++){
			cfg.columns[c].align = 'center';
		}
		
		var cm = new Ext.grid.ColumnModel(cfg.columns);
		if (cfg.height == undefined){
			cfg.height = 300;
		}
		
		Boss.Ext.Grid.superclass.constructor.call(this,{
			height:cfg.height,
			stripeRows:true,
			loadMask:true,
			cm:cm,
			autoWidth:true,
			store : ds,
			header:cfg.header,
			sm : sm,
			border:false,
			frame:false,
			title:cfg.title,
			viewConfig:{
				columnsText : bundle.getMsg('com.label.showcolumns'),//'显示列',
				scrollOffset : 30,
				sortAscText : bundle.getMsg('com.label.asc'),//'升序',
				sortDescText : bundle.getMsg('com.label.desc')//'降序'
			},
			bbar:new Boss.Ext.PagingToolBar(ds,cfg),
			view : gview,
			plugins:summary,
			tbar:cfg.tbar,
			listeners:{
				'render' :function(){
					if (cfg.bottomBar){
						var bottomBar = new Ext.Toolbar ({
								items:cfg.bottomBar//,
									//	style: 'background-color:#F7F5F4; background-image:url();'
						});
						bottomBar.render(this.bbar);
					};
				}
			}
		});
		
		if ((cfg.page == undefined) || (cfg.page == false)){
			this.getBottomToolbar().hide();
		} else {
			this.pageSize = cfg.pageSize;
		}
		if (this.getTopToolbar() != undefined){
			//this.getTopToolbar().style='background-color:#F7F5F4; background-image:url();';
		}
		//实现load后默认选择第一行
		var b = true;
		
		if (cfg.defaultSelect != undefined)
		  b = cfg.defaultSelect;
		  
		ds.on({  
           load:{
               fn:function(){
                 this.recordCount = ds.getTotalCount();
                 if (this.getBottomToolbar()){
						this.getBottomToolbar().updateInfo(this.recordCount);
				 };
                 if (b){
                 		if (this.recordCount > 0){
	                 		this.getSelectionModel().selectFirstRow();
	                 		this.getView().focusRow(0);
                 		};
	                 	if (cfg.fireRowClick){
	                 		this.fireEvent('rowClick');
	                 	};
                 }
               }
           },
           scope:this
       	});
       	//默认选中第一行
       	if (b){
			this.on('viewready',function(){
         		if (this.recordCount > 0){
             		this.getSelectionModel().selectFirstRow();
             		this.getView().focusRow(0);
         		};
             	if (cfg.fireRowClick){
             		this.fireEvent('rowClick');
             	};
			});
       	};

	},
	/**
	 * 装载数据。该方法简化了Data.Store的数据请求操作。
	 * 数据查询时，建议装载数据采用次方法，不要用Ext.Data.Store.load()方式（在分页条中刷新会有问题）
	 * @param {Json} params，请求参数
	 */
	loadData : function(params){
		this.getStore().lastOptions = {};
		this.getStore().baseParams = params;
		this.getStore().reload();
	},
	/**
	 * 获取选择行
	 * @return Ext.data.Record数组
	 */
	getSelections : function(){
		return this.getSelectionModel().getSelections();
	},
	/**
	 * 获取选择行的字段组成的字符串，以逗号隔开
	 * @param {String} fieldName 获取值的字段名，为空默认:id
	 * @return {String}
	 */
	getSelectIds : function(fieldName){
		var rec = this.getSelections();
		if (rec.length == 0){
			return '';
		};
		var id = (fieldName == undefined) || (fieldName == '')?'id':fieldName;
		var ids = '';
		Ext.each(rec,function(item){
			ids = ids + item.get('id') +',';
		});
		return ids.substring(0,s.length-1);
		
	},
	/**
	 * 获取选择行的字段值的数组
	 * @param {String} fieldName 获取值的字段名，为空默认:id
	 * @return {Array}
	 */
	getSelectIdsArray : function(fieldName){
		var array = new Array();
		var rec = this.getSelections();
		if (rec.length == 0){
			return array;
		};
		var id = (fieldName == undefined) || (fieldName == '')?'id':fieldName;
		var ids = '';
		Ext.each(rec,function(item){
			array.push(item.get('id'));
		});
		return array;
	},
	/**
	 * 获取当前选择行（光标所在行）
	 * @return {} Ext.data.Record 
	 */
	getActiveRecord : function(){
		//var selections = this.getSelectionModel().getSelections();
		//return selections[0];
		return this.getSelectionModel().getSelected();
	},
	/**
	 * 插入一条新记录，用于新建一条记录后，在前台插入一条记录，该方法会自动更新分页条中的分页信息
	 * @param {Ext.data.Record} record
	 * @return {}
	 */
	insertRecord : function(record){
		this.getStore().insert(0,record);
		this.getStore().commitChanges();
		this.getView().refresh();
		if (this.recordCount){
			this.recordCount = this.recordCount + 1;
		} else {
			
			this.recordCount = 1;
		
		}
	
		//确保增加时，每页显示的条数不超过设定值
		if (this.pageSize){
			var icount = this.getStore().getCount();
			for(var i=icount;i>this.pageSize;i--){
				this.getStore().remove(this.getStore().getAt(i-1));
			}
		}
		
		if (this.getBottomToolbar()){
			this.getBottomToolbar().updateInfo(this.recordCount);
		}
		
		//选择第一行
		this.getSelectionModel().selectFirstRow();
		
		if (this.cfg.fireRowClick){
	    	this.fireEvent('rowClick');
	    };
		
	},
	/**
	 * 删除选择的当前记录
	 * @deprecated
	 * 该方法仅支持单条记录的删除操作
	 */
	deleteRecord : function(){
		this.getStore().remove(this.getActiveRecord());
		this.getStore().commitChanges();
		this.getView().refresh();
		if (this.recordCount){
			this.recordCount = this.recordCount -1;
		} else {
			this.recordCount = 0;
		}
		
		if (this.recordCount <0 ){
			this.recordCount = 0;
		}
		
		if (this.getBottomToolbar()){
			this.getBottomToolbar().updateInfo(this.recordCount);
		}
		if (this.cfg.fireRowClick){
	    	this.fireEvent('rowClick');
	    };
	},
	findField : function(sfield){
		for (var i =0;i< this.Fields.length;i++){
			var aj = this.Fields[i];
			if (aj.name == sfield){
				return true;
			}
		}
		return false;
	},
	/**
	 * 更新修改的记录
	 * @param {String} aJSON  通常是由Ext.form.getForm().getValues()生成
	 */
	updateRecord : function(aJSON){
		var rec = this.getActiveRecord();
		for(var item in aJSON){
			if (this.findField(item)){
				rec.set(item,aJSON[item]);
			}
		};
		this.getStore().commitChanges();
	},
	/**
	 *根据Ext.data.Record的字段colName查找值为fieldvale的记录
	 * @param {String} colName   列名
	 * @param {String} fieldvalue  字段值
	 * @return {Array}  Ext.data.Record 数组
	 */
	findRecordByColValue:function(colName,fieldvalue){
		var arrayRec = new Array();
		
		this.getStore().each(function(rec){
			if (rec.get(colName) == fieldvalue){
				arrayRec.push(rec);
			}
		});
		return arrayRec;
	},
	/**
	 * 获得DataIndex和Header的Json对象，格式{dataIndex:Header}，主要用于多语言翻译
	 * @return {Json}
	 */
	getDataIndexHeader : function(){
		var dh = {};
		var cms = this.getColumnModel(false);
		var icount = cms.getColumnCount(false);
		for(var i=0;i<icount;i++){
			var s1 = cms.getColumnHeader(i);
			var s2 = cms.getDataIndex(i);
			if ( (s2) && (s2.length > 0) ){
				if (s2.toLowerCase() != 'id'){
					var s = 'dh.'+s2+'="'+s1+'"';
					eval(s);
				}
			}
		}
		if (this.hiddenColumns){
			Ext.each(this.hiddenColumns,function(item){
				var s = 'dh.'+item.dataIndex+'="'+item.header+'"';
				eval(s);
			});
		}
		return dh;
	},
	/**
	 * 用于删除选择记录的数据提交，用于单选或多选删除，该方法实现了通用的删除模式，会调用deleteOperationAction.delete.exec.action
	 * @param {String} delName  对应delete.cfg.xml配置文件中的删除节点名
	 * @param {String} id       删除关键字段名称，可不定义，默认为"id"
	 * @param {function} callback 回调函数,删除完后执行回调函数
	 * @return {}  
	 */
	deleteSelected:function(delName,id,callback){
		
		var ins = this;
		
		var rec = this.getSelections();
		
		if (rec.length == 0){
		
			Boss.Util.msgAlert(bundle.getMsg('com.messages.selectrecordtodel'));//'请选择要删除的记录'
			
			return false;
			
		}
		
		var ids = '';
		
		var idField = "id";
		
		if (id != undefined) {
			idField = id;
		};
		
		var delArray = [];
		var encn = {};
		
		Ext.each(rec,function(item){
			ids = ids + item.get(idField)+',';
			
			var rdata = item.data;
			
			var tmp = {};
			Boss.Util.incpJson(rdata,tmp);
			
			var rn = ins.getRowNum(item);
			var ndata = ins.getARowViewJson(rn);
			Boss.Util.incpJson(ndata,tmp);
			
			delArray.push(tmp);//item.data);
		});
		
		var logJson = {crud:bundle.getMsg('com.label.delete'),table:delName,data:delArray,encn:this.getDataIndexHeader()};
		
		var logJsonArray = [logJson];
		
		var delLog = Ext.encode(logJsonArray);

		ids = ids.substr(0,ids.length-1);
		
		var params = {delName:delName,ids:ids,delLog:delLog};
		
		Ext.Msg.confirm(bundle.getMsg('com.messages.title.sysConfirmNotice'),bundle.getMsg('com.messages.confimdelete'),function(btn){ //'是否执行删除操作?'
			
			if (btn == 'yes'){
			
				Ext.Ajax.request({
					url:'deleteOperationAction.delete.exec.action',
					params:params,
					success:function(resp,opts){
						var aJason = Ext.util.JSON.decode(resp.responseText);
						if (aJason.success){
							Boss.Util.msgAlert(bundle.getMsg('com.messages.delete.success'));//('系统提示','删除成功');
							//从界面中删除记录
							Ext.each(rec,function(item){
								ins.getStore().remove(item);
								if (ins.recordCount){
									ins.recordCount = ins.recordCount -1;
								} else {
									ins.recordCount = 0;
								}
								
								if (ins.recordCount <0 ){
									ins.recordCount = 0;
								}
							});
							//更新页面信息
							if (ins.getBottomToolbar()){
								ins.getBottomToolbar().updateInfo(ins.recordCount);
								if (ins.getStore().getCount() == 0){
									ins.getStore().reload();
								}
							};
							//默认选中一行
							if (ins.getStore().getCount() > 0){
								ins.getSelectionModel().selectFirstRow();
							}
							if (ins.cfg.fireRowClick){
	    						ins.fireEvent('rowClick');
	    					};
						} else {
							Boss.Util.msgError(bundle.getMsg('com.messages.delete.failure')+'<br>'+bundle.getMsg(aJason.msg));
						}
						self.close();
					},
					failure:function(resp,opts){
						Boss.Util.msgError(bundle.getMsg('com.messages.delete.failure')+'<br>'+bundle.getMsg(aJason.msg));
					},
					callback:function(){
						eval(callback);
					}
				});
			}
		});	
	},
	/**
	 * 把选中的记录转换成Json格式的字符串，用于Ext.Ajax.request提交
	 * @return {String}
	 */
	getSelectedJSON : function(){
		var jsonArray = [];
		var recSelected = this.getSelections();
		Ext.each(recSelected,function(item){
			jsonArray.push(item.data);
		});
		return Ext.encode(jsonArray);
	},
	/**
	 * 禁用工具栏操作
	 * @param {boolean} disable  true：是，false ：否 
	 */
	disableOperateBar : function(disable){
		this.getTopToolbar().setDisabled(disable);
	},
	/**
	 * 获取修改日志,主要指选中添加操作日志
	 * @param {} fk1  外键名，待插入数据表中的外键，1*表
	 * @param {} fk2  外键名，待插入数据表中的外键，n*表
	 * @param {} fk1value  fk1对应的字段值
	 */
	setUpdLog:function(fk1,fk2,fk1value){
		this.updLog = '';
		var self = this;
		var rec = this.getSelections();
		if (rec.length == 0){
			return;
		};
		var dataArray = [];
		Ext.each(rec,function(item){
			var json = {id:0};
			eval('json.'+fk1+'='+fk1value);
			eval('json.'+fk2+'='+item.get('id'));
			dataArray.push(json);
		});
		this.logJson = {crud:bundle.getMsg('com.label.add'),table:'',data:dataArray,encn:this.getDataIndexHeader()};
		this.updLog = Ext.encode([this.logJson]);
	},
	/**
	 * 返回更改记录的Json字符串
	 * @return {String} Json格式的字符串，当为''标识没有更改记录
	 */
	getUpdJsonString : function(){
		var tmp = this.getStore().modified.slice(0);
		if (tmp.length == 0){
			return '';
		}
		var jsonArray = [];
		Ext.each(tmp,function(item){
			jsonArray.push(item.data);
		});
		return Ext.encode(jsonArray);
	},
	/**
	 * 获取某一记录的行号
	 * @param {} rec
	 * @return {}
	 */
	getRowNum : function(rec){
		return this.getStore().indexOf(rec);
	},
	
	getARowViewJson : function(rownum){
		var cms = this.getColumnModel(false);
		var ic = cms.getColumnCount(false);
		var gv = this.getView();
		var result = {};
		for (var i=0;i<ic;i++){
			var s2 = cms.getDataIndex(i);
			var cell = gv.getCell(rownum,i);
			var div = cell.childNodes[0]; 
			var s = Boss.Util.getHtmlElementValue(div);
			
			//add by wangsong
			s = Boss.Util.valueConverter(s,s2);
			//add by wangsong
			
			if (s && s.length > 0 && s2.length > 0){
				var ss = 'result.'+s2+'="'+s+'"';
				eval(ss);
			}
		}
		return result;
	},
	getARecViewJson:function(rec){
		var rn = this.getRowNum(rec);
		return this.getARowViewJson(rn);
	},
	getActiveRecViewJson : function(){
		var rec = this.getActiveRecord();
		return this.getARecViewJson(rec);
	}
});


/**
 * @class Boss.Ext.Band
 * @extends Ext.util.Observable
 * 主要是为了简化实现布局中的列模式，<br>
 * 在列布局中通过定义一个Band，可以定义包含的列，并允许往指定列加入UI元素。
 * <pre><code>
 * var band1 = new Boss.Ext.Band({columns:[.9,.1]});
 * var txtServiceName = new Ext.form.TextField({
 * 					fieldLabel : '服务名称',
 * 					anchor : '100%',
 * 					id : 'servName',
 * 					allowBlank:false
 * 				});
 * band1.addUI(0,txtServiceName);
 * var txtNote = new Ext.form.TextArea({
 * 					xtype : 'textarea',
 * 					fieldLabel : '备注',
 * 					anchor : '100%',
 * 					id : 'note'
 * 				});
 * 				
 * band1.addUI(0,txtNote);
 * band1.addAsteriskColumn(1);//加入红星号提示必填项
 * var editFrm = new Boss.Ext.Form({header:false}); //将Band加入窗体
 * editFrm.add(band1);
 * </code></pre>
 */
Boss.Ext.Band = Ext.extend(Ext.util.Observable,
		{
	/**
	 * 构造函数
	 * @param {} cfg 配置项，格式：<br>
	 * 				{ <br>
     * 					<B>margin</B>:.05,   //左右边距，用于元素居中 <br>
     * 					<B>columns</B>:[.3,.3,.3] //一个Band分成的列所占比例 <br>
     * 				} <br>
	 */
	constructor:function(cfg){
		this.layout = 'column';
		this.imargin = 0;
		if (cfg.margin != undefined){
			this.imargin = cfg.margin;
		};
		this.items = [];
		if (cfg.columns != undefined){
			this.addColumns(cfg.columns);
		};
	},
	/**
	 * 增加列
	 * @param {Array} cols  数组，表示列占宽度百分比,如加入三列：[.3,.3,.3]
	 * @return {}
	 */
	addColumns : function(cols){
		if (this.imargin > 0){
			this.addEmptyColumn(this.imargin);
		}
		for(var i =0;i<cols.length;i++){
			this.items.push({
				layout : 'form',
				columnWidth : cols[i],
				items : []
			});
		}
		if (this.imargin > 0){
			this.addEmptyColumn(this.imargin);
		}
	},
	/**
	 * 增加指定宽度一列
	 * @param {Integer} width 列宽
	 * @return {}
	 */
	addAColumn : function(width){
		this.items.push({
			layout : 'form',
			columnWidth : width,
			items : []
		});
	},
	/**
	 * 在Band一列中加入UI控件
	 * @param {integer} col 列
	 * @param {UI} UI 可为控件数组
	 * @return {}
	 */
	addUI : function(col,UI){
		if (typeof UI == 'Array'){
			for(var i=0;i<UI.length;i++){
				this.items[col].items.push(UI[i]);
			}
		} else {
			this.items[col].items.push(UI);
		}
	},
	/**
	 * 加入空列，用于居中
	 * @param {integer} colWidth 空列宽度
	 */
	addEmptyColumn : function(colWidth){
		this.items.push({
			columnWidth:colWidth,
			html:'&nbsp;&nbsp;'
		});
	},
	/**
	 * 加入红色星号，用于必填项
	 * @param {integer} col 列
	 * @param {integer} h  所占的高度，可忽略，默认为26  
	 * @param {integer} w  所占的宽度，可忽略，默认为50
	 */
	addAsteriskColumn: function(col,h,w,name){
		var iw = 50;
		if (w != undefined){
			iw = w;
		}
		var ih = 26;
		if (h != undefined){
			ih = h;
		}
		var shtml='<table width="'+w+'" height="'+ih+'" border="0" cellpadding="0" cellspacing="0"><tr><td id='+name+' align="center" valign="middle"><span style="color:#FF0000">&nbsp;*&nbsp;</span></td></tr></table>';
		this.addUI(col,{xtype:'box',height:ih,html:shtml});
	},
	/**
	 * 加入空表，用于增加在列中增加空白区域
	 * @param {integer} col  列
	 * @param {integer} height 空白区域的高度
	 * @param {integer} width 空白区域的宽度
	 */
	addANullTable: function(col,height,width,name){
		var ih = 26;
		var iw = 22;
		if (height != undefined){
			ih = height;
		};
		if (width != undefined){
			iw = width;
		}
		
		var shtml='<table width="'+iw+'"  height="'+ih+'"  border="0"><tr> <td id='+name+' width="16" align="center" valign="middle"></td></tr></table>';
		this.addUI(col,{xtype:'label',height:30,html:shtml});
	}
});

/**
 * @class Boss.Ext.Form
 * @extends Ext.form.FormPanel
 * 实现对FormPanel封装,简化Ext.form.FormPanel的创建
 */
Boss.Ext.Form = Ext.extend(Ext.form.FormPanel,{
	/**
	 * 表单修改日志，若想获得该属性，需要先调用setUpdLog，格式：
	 * 	[{"crud":"c","table":"","data":[{"id":"->0","servType":"->2","servName":"->32323","entMode":"->0","twoLevelFlag":"->true","note":"->323"}]}]
	 * @type String
	 * @property
	 */
	updLog : '',
	
	/**
	 * 表单id和fieldLabel的Json对象，该属性有函数getSimpleJson进行赋值，格式:{id:fieldLabel}
	 * @type Json
	 */
	idLabelJson : {},
	
	/**
	 * 记录加载到表单的原数据
	 * @type Ext.data.Record
	 * @property 
	 */
	record : null,
	/**
	 * 构造函数
	 * @param {} cfg 配置项，格式：{height:200,title:'dddd'}
	 */
	constructor:function(cfg){
		this.cfg = cfg;
		if (cfg.header == undefined){
			cfg.header = true;
		}
		if(cfg.autoWidth == undefined){
			cfg.autoWidth = true;
		}
		Boss.Ext.Form.superclass.constructor.call(this,{
			autoHeight:true,
			autoWidth:cfg.autoWidth,
			autoDestroy:true,
			header:cfg.header,
			title:cfg.title,
			frame:true,
			labelAlign:"right",
			labelWidth:cfg.labelWidth,
			buttonAlign:'center',
			buttons:cfg.buttons
		});
	},
	/**
	 * 在From中加入空的Band，用于增加边距
	 * @param {Integer} height 高度
	 */
	addVMargin : function(height){
		var bd = new Boss.Ext.Band({columns:[1]});
		var h = 5;
		if (height){
			h = height;
		};
		bd.addANullTable(0,h,3);
		this.add(bd);
	},
	/**
	 * 增加重置按钮
	 * @param {Ext.form.FormPanel} frm  窗体实例
	 */
	addResetButton:function(frm){
		this.addButton({
			text:bundle.getMsg('com.label.reset'),//'重置',
			handler : function(){
				 frm.getForm().reset();
			}
		});
	},
	/**
	 * 增加确定按钮
	 * @param {function} fn  按钮单击处理函数
	 */
	addSubmitButton:function(fn){
		this.addButton({
					text :bundle.getMsg('com.label.confirm'),// '确定',
					iconCls:'btn-sure',
					handler : fn
				});
	},
	/**
	 * 加载Ext.data.Record对象的数据到表单元素中，该实例实现了原值的保存
	 * @param {} record
	 */
	loadRecord : function(rec){
		this.record = rec;
		this.getForm().loadRecord(rec);
	},
	/**
	 * 表单提交，封装Ext.form.BasicForm 的submit方法
	 * @param {Json} cfg 配置项，格式：
	 *    <br>{<br>
	 * 			<B>url</B>:请求URL<br>
	 * 			<B>success</B>：请求成功后的回调函数,fn(action)<br>
	 * 		}
	 */
	submit : function(cfg){
		this.getForm().submit({
			waitTitle :bundle.getMsg('com.messages.waitTitle'),//请等待
			waitMsg : bundle.getMsg('com.messages.saving'),//'保存中...',
			url:cfg.url,
			success:function(form,action){
				Boss.Util.msgAlert(bundle.getMsg('com.messages.save.success'));//('系统提示','保存成功');
				if (typeof cfg.success == 'function'){
					cfg.success(action);
				}
			},
			failure:function(form,action){
				Boss.Util.msgError(action.result.msg);
			}
		});
	},
	/**
	 * 获取弹出窗体修改轨迹的Json对象，内容只包括表单修改日志，不包括界面上的多选列表
	 * @param {Ext.data.Record} record 加载到窗体的record，提供原值
	 * @param {textField} txtLog UI界面中用于保存修改日志的textField文本框
	 * @return {Json}
	 */
	getSimpleJson : function(record,txtLog){
		var field = "";
		var value = "";
		var oldValue = "";
		var id = (record)?record.get('id'):0;
		var tmp = {
        			id:id
        };
        for(key in this){
            if(typeof(this[key])=='function'){  	               
            }else{
            	if ((this[key])&& 
            		(typeof this[key].getValue == 'function') && (this[key].getValue() != undefined)&&
            		(typeof this[key].getName == 'function')&&(this[key].getName() != undefined) ){
                	
                	field = this[key].getName();
                	
                	if ( (txtLog) && (field == txtLog.getName()) ){
                		continue;
                	};
        			
                	
                	
                	value = this[key].getValue();
                	
                	if(record){
                	   	oldValue = record.get(field);
                	}
                	
                	if (oldValue == null){
                		oldValue = '';
                	}
                	
                	if (this[key].fieldLabel){
                		eval('this.idLabelJson.'+field+'="'+this[key].fieldLabel+'"');
                	}
                	
                	if (oldValue != value){
                		if (id > 0){
                			eval('tmp.'+field+'="'+oldValue+'->'+value+'"');
                		} else {
                			eval('tmp.'+field+'="'+value+'"');
                		}
                	}
            	}
            }
    	};
    	return tmp;
	},
	/**
	 * 记录表单的更改日志信息
	 * @param {Ext.data.Record} record 加载到窗体的record，提供原值
	 * @param {textField} txtLog UI界面中用于保存修改日志的textField文本框
	 * @param {Array} idsArray 批量添加的值（用于弹出窗口中存在表单域和列表选择）
	 * @param {String} idFK 批量添加值对应在从表中的字段（用于弹出窗口中存在表单域和列表选择）
	 * @return {} 
	 */
	setUpdLog : function(record,txtLog,idsArray,idFK){
		var field = "";
		var value = "";
		var oldValue = "";
		var dataArray = [];
		this.updLog = '';
		var tmp = this.getSimpleJson(record,txtLog);
		var b = ( Boss.Util.countJsonAttr(tmp) > 1);
    	if(b){
    		if((idsArray == undefined) || (idsArray.length == 0) || (idFK == undefined) || (idFK == '')){
    			dataArray.push(tmp);
    		} else {
    			//批量添加
    			for(var i=0,icount=idsArray.length;i<icount;i++){
    				var tmp0 = {};
    				for(key in tmp){
    					eval('tmp0.'+key+'=tmp.'+key);
    				};
    				eval('tmp0.'+idFK+'='+idsArray[i]);
    				dataArray.push(tmp0);
    			};
    		};
    		var json = {
    			crud:(record)?bundle.getMsg('com.label.edit'):bundle.getMsg('com.label.add'),//'u':'c',
    			table:'',
    			data : dataArray,
    			encn:this.idLabelJson
    		};
    		var jsonArray = [json];
    		this.updLog = Ext.encode(jsonArray);
    	};
    	if (txtLog){
    		txtLog.setValue(this.updLog);
    	}
	}
});

/**
 * @class Boss.Ext.Window
 * @extends Ext.Window
 * 实现对Ext.Window的封装，主要实现功能：<br>
 * 1、添加确定按钮、取消按钮，统一取消按钮的操作处理<br>
 * 2、提供窗体显示方法
 * <pre><code>
 *    var win = new Boss.Ext.Window({
 *                    	title: '弹出窗体范例'
 *               });
 *    win.addCancel(win); //添加取消按钮
 *    win.addSubmit(fn);  //添加确定按钮
 * 	  win.showCenter();   //显示窗体在工作区的中央
 * </code></pre>
 */
Boss.Ext.Window = Ext.extend(Ext.Window,{
	/**
	 * 表单修改日志，若想获得该属性，需要先调用setUpdLog，格式：
	 * 	[{"crud":"c","table":"","data":[{"id":"->0","servType":"->2","servName":"->32323","entMode":"->0","twoLevelFlag":"->true","note":"->323"}]}]
	 * @type String
	 * @property
	 */
	updLog : '',
	/**
	 * 日志Json对象，实现增加属性的功能，然后通过Ext.encode([logJson])获取日志进行提交
	 * @type Json 
	 */
	logJson :{},
	/**
	 * 表单id和fieldLabel的Json对象，该属性有函数getSimpleJson进行赋值，格式:{id:fieldLabel}
	 * @type Json
	 */
	idLabelJson : {},
	
	oldValueJson : {},
	/**
	 * 构造方法
	 * @param {} cfg 参考Ext.Window的配置项
	 */
	constructor:function(cfg){
		this.cfg = cfg;
		Ext.apply(this,cfg);
		Boss.Ext.Window.superclass.constructor.call(this,{
			resizable : false,
			autoDestroy : true,
			closeAction:'close',
			modal : true
		});
	},
	/**
	 * 析构函数
	 */
	destroy : function () {  
		this.win = null;
        Boss.Ext.Window.superclass.destroy.call(this);  
    },
    /**
     * 添加取消按钮，自动实现关闭窗体的事件
     * @param {Boss.Ext.Window} win 创建的窗体对象本身
     */
	addCancel:function(win){
		this.win = win;
		this.addButton({text:bundle.getMsg('com.label.cancel'),iconCls:'btn-cancel'},function(){
			win.close();
			win = null;
		},this);
	},
	/**
	 * 添加确定按钮
	 * @param {function} fn  按钮单击事件处理函数
	 */
	addSubmit:function(fn){
		this.addButton({
					text :bundle.getMsg('com.label.confirm'),// '确定',
					iconCls:'btn-sure',
					handler : fn
				});
	},
	/**
	 * 显示窗体
	 * @param {integer} left  横坐标
	 * @param {integer} top   纵坐标
	 */
	showPos:function(left,top){
		this.setPosition(left,top);
		this.show();
	},
	/**
	 * 在工作区中央显示窗体
	 */
	showCenter:function(){
		this.setPosition(document.body.clientWidth / 2 - this.width / 2,document.body.clientHeight / 2 - this.height / 2);
		this.show();
	},
	/**
	 * 根据界面元素，获取数据Json对象
	 * @return {}
	 */
	getJsonData : function(){
		var tmp = {};
		for(key in this){
            if(typeof(this[key])=='function'){  	               
            }else{
            	if ((this[key])&& 
            		(typeof this[key].getValue == 'function') && (this[key].getValue() != undefined)&&
            		(typeof this[key].getName == 'function')&&(this[key].getName() != undefined) ){
                	
                	field = this[key].getName();
       
                	if ( (this[key].getXType() == 'combotree') || (this[key].getXType() == 'sysRegionComboBoxTree') ){
                		continue;
                	}
                	
                	if ( (this[key].getXType() == 'dataDictComboBox') ||
                		 (this[key].getXType() == 'combo') ||
                		 (this[key].getXType() == 'tableComboBox') ||
                		 (this[key].getXType() == 'BossExtComboBox')){

                		value = this[key].getRawValue();
                		
                	} else	if (this[key].getXType() == 'radiogroup'){
                		value = this[key].getValue().inputValue;
                	} else {
                		value = this[key].getValue();
                	}
            		eval('tmp.'+field+'="'+value+'"');
            	}
            }
    	}
    	return tmp;
	},
	/**
	 * 获取弹出窗体修改轨迹的Json对象，内容只包括表单修改日志，不包括界面上的多选列表
	 * @param {Ext.data.Record} record 加载到窗体的record，提供原值
	 * @param {textField} txtLog UI界面中用于保存修改日志的textField文本框
	 * @return {Json}
	 */
	getSimpleJson : function(record,txtLog){
		var field = "";
		var value = "";
		var oldValue = "";
		var id = (record)?record.get('id'):0;
		var tmp = {	id:id };
        for(key in this){
            if(typeof(this[key])=='function'){  	               
            }else{
            	if ((this[key])&& 
            		(typeof this[key].getValue == 'function') && (this[key].getValue() != undefined)&&
            		(typeof this[key].getName == 'function')&&(this[key].getName() != undefined) ){
                	
                	field = this[key].getName();
                	
                	if ( (txtLog) && (field == txtLog.getName()) ){
                		continue;
                	};
        
                	if ( (this[key].getXType() == 'combotree') || (this[key].getXType() == 'sysRegionComboBoxTree') ){
                		continue;
                	}
                	if ( (this[key].getXType() == 'dataDictComboBox') ||
                		 (this[key].getXType() == 'combo') ||
                		 (this[key].getXType() == 'tableComboBox') ||
                		 (this[key].getXType() == 'BossExtComboBox')){

                		value = this[key].getRawValue();
                		
                	} else if (this[key].getXType() == 'radiogroup'){
                		value = this[key].getValue().inputValue;
                	} else {
                		value = this[key].getValue();
                	}
                	
                	if(record){
                	   	oldValue = record.get(field);
                	   	var sol = eval('this.oldValueJson.'+field);
                	   	if ( (sol) && (sol.length > 0) ){
                	   		oldValue = sol;
                	   	}
                	}
                	
                	if (oldValue == null){
                		oldValue = '';
                	}
                	
                	//add by wangsong
					oldValue = Boss.Util.valueConverter(oldValue,field);
					//add by wangsong
                	
                	if (this[key].fieldLabel){
                		eval('this.idLabelJson.'+field+'="'+this[key].fieldLabel+'"');
                	}
                	
                	if (oldValue != value){
                		if (id > 0){
                			eval('tmp.'+field+'="'+oldValue+'->'+value+'"');
                		} else {
                			eval('tmp.'+field+'="'+value+'"');
                		}
                	}
            	}
            }
    	};
    	return tmp;
	},
	/**
	 * 记录表单的更改日志信息
	 * @param {Ext.data.Record} record 加载到窗体的record，提供原值
	 * @param {textField} txtLog UI界面中用于保存修改日志的textField文本框
	 * @param {Array} idsArray 批量添加的值（用于弹出窗口中存在表单域和列表选择）
	 * @param {String} idFK 批量添加值对应在从表中的字段（用于弹出窗口中存在表单域和列表选择）
	 * @return {} 
	 */
	setUpdLog : function(record,txtLog,idsArray,idFK){
		var field = "";
		var value = "";
		var oldValue = "";
		var dataArray = [];
		this.updLog = '';
		var tmp = this.getSimpleJson(record,txtLog);
		var b = ( Boss.Util.countJsonAttr(tmp) > 1);
    	if(b){
    		if((idsArray == undefined) || (idsArray.length == 0) || (idFK == undefined) || (idFK == '')){
    			dataArray.push(tmp);
    		} else {
    			//批量添加
    			for(var i=0,icount=idsArray.length;i<icount;i++){
    				var tmp0 = {};
    				for(key in tmp){
    					eval('tmp0.'+key+'=tmp.'+key);
    				};
    				eval('tmp0.'+idFK+'='+idsArray[i]);
    				dataArray.push(tmp0);
    			};
    		};
    		this.logJson = {
    			crud:(record)?bundle.getMsg('com.label.edit'):bundle.getMsg('com.label.add'),
    			table:'',
    			data : dataArray,
    			encn:this.idLabelJson
    		};
    		var jsonArray = [this.logJson];
    		this.updLog = Ext.encode(jsonArray);
    	};
    	if (txtLog){
    		txtLog.setValue(this.updLog);
    	}
	},
		/**
	 * 在From中加入空的Band，用于增加边距
	 * @param {Integer} height 高度
	 */
	addVMargin : function(height){
		var bd = new Boss.Ext.Band({columns:[1]});
		var h = 5;
		if (height){
			h = height;
		};
		bd.addANullTable(0,h,3);
		this.add(bd);
	},
	/**
	 * 设置原值json，该json对象应该包含修改记录的界面数据，可通过Boss.Ext.GridPanel的getActiveRecViewJson()获得
	 * @param {} old
	 */
	setOldJson : function(old){
		this.oldValueJson = old;
	}
});

/**
 * @class Boss.Ext.ComboBox
 * @extends Ext.form.ComboBox
 * 下拉框，简化Ext.form.ComboBox从数据库中获取数据的处理方法，值需要传入url和root参数即可
 **/
Boss.Ext.ComboBox = Ext.extend(Ext.form.ComboBox,{
	/**
	 * 构造函数
	 * @param {} cfg 配置项，格式：<br>
	 * cfg:{<br>
	 * 		url:   请求数据的URL <br>
	 * 		root:  服务端返回数据项<br>
	 * 		editable:是否可编辑<br>
	 * }
	 */
	constructor:function(cfg){
		this.cfg = cfg;
		Ext.apply(this,cfg);
		var ds;
		if((cfg.url != undefined) && (cfg.url != ''))
		{

			var Recorder = new Ext.data.Record.create(cfg.fields);
		
			ds = new Ext.data.Store({
				proxy:new Ext.data.HttpProxy({url:cfg.url}),
 				reader: new Ext.data.JsonReader({
						root:cfg.root,
						totalProperty:cfg.total},
						Recorder)
			});
			ds.load();
    	} else {
			ds = new Ext.data.SimpleStore({
					data:cfg.data,
					fields:cfg.fields
			});
		};
		
		Boss.Ext.ComboBox.superclass.constructor.call(this,{
			editable: cfg.editable,
    		mode: 'local',
    		store : ds,
    		triggerAction: 'all',
    		valueField : cfg.fields[0],
    		displayField: cfg.fields[1],
        	emptyText:bundle.getMsg('com.label.select')//'请选择'
		});
	}
});

if(typeof RegExp.escape != 'function') {
	RegExp.escape = function(s) {
   		if('string' !== typeof s) {
    		return s;
   		}
   	return s.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
	};
}

/**
 * @class Boss.Ext.MultiSelectComb
 * @extends Ext.form.ComboBox
 * 下拉多选框，通过增加css <br>
 * .ux-MultiSelect-icon {
 * width:16px;
 * height:16px;
 * float:left;
 * background-position: -1px -1px ! important;
 * background-repeat:no-repeat ! important;
 * }
 * .ux-MultiSelect-icon-checked {
 * background: transparent url(../resources/images/default/menu/checked.gif);
 * }
 * .ux-MultiSelect-icon-unchecked {
 * background: transparent url(../resources/images/default/menu/unchecked.gif);
 * }
*/

Boss.Ext.MultiSelectComb = Ext.extend(Ext.form.ComboBox,{
	checkField:'checked',
	separator:',',
	initComponent:function(){
	   	if(!this.tpl) {
	    	this.tpl = '<tpl for=".">'
	     			+'<div class="x-combo-list-item">'
			     	+'<img src="' + Ext.BLANK_IMAGE_URL + '" '
			     	+'class="ux-MultiSelect-icon ux-MultiSelect-icon-'
			     	+'{[values.' + this.checkField + '?"checked":"unchecked"' + ']}">'
			     	+'{[values.'+this.displayField+']}'
			     	+'</div>'
			     	+'</tpl>';
	   	}
	   	Boss.Ext.MultiSelectComb.superclass.initComponent.apply(this, arguments);
	   	this.on({scope:this,
	   			beforequery:this.onBeforeQuery,
	   			blur:this.onRealBlur});
	   			
	   	this.onLoad = this.onLoad.createSequence(function() {
    		if(this.el) {
     			var v = this.el.dom.value;
     			this.el.dom.value = '';
     			this.el.dom.value = v;
    		}
   		});
	},
	initEvents:function() {
   		Boss.Ext.MultiSelectComb.superclass.initEvents.apply(this, arguments);
   		this.keyNav.tab = false;

	},
	clearValue:function() {
   		this.value = '';
   		this.setRawValue(this.value);
   		this.store.clearFilter();
   		this.store.each(function(r){
    		r.set(this.checkField, false);
   			}, this);
   		if(this.hiddenField) {
    		this.hiddenField.value = '';
   		}
   		this.applyEmptyText();
	},
	getCheckedDisplay:function() {
   		var re = new RegExp(this.separator, "g");
   		return this.getCheckedValue(this.displayField).replace(re, this.separator + ' ');
	},
	getCheckedValue:function(field) {
   		field = field || this.valueField;
   		var c = [];
   		var snapshot = this.store.snapshot || this.store.data;
   		snapshot.each(function(r) {
    		if(r.get(this.checkField)) {
     			c.push(r.get(field));
    		}
   		}, this);
   		return c.join(this.separator);
	},
	onBeforeQuery:function(qe) {
   		qe.query = qe.query.replace(new RegExp(RegExp.escape(this.getCheckedDisplay()) + '[ ' + this.separator + ']*'), '');
	},
	onRealBlur:function() {
   		this.list.hide();
   		var rv = this.getRawValue();
   		var rva = rv.split(new RegExp(RegExp.escape(this.separator) + ' *'));

   		var va = [];
   		var snapshot = this.store.snapshot || this.store.data;

   		Ext.each(rva, function(v) {
    		snapshot.each(function(r) {
     			if(v === r.get(this.displayField)) {
      				va.push(r.get(this.valueField));
     			}
    		}, this);
   		}, this);
   		this.setValue(va.join(this.separator));
   		this.store.clearFilter();
	},
	onSelect:function(record, index) {
        if(this.fireEvent('beforeselect', this, record, index) !== false){
    		record.set(this.checkField, !record.get(this.checkField));
	    	if(this.store.isFiltered()) {
     			this.doQuery(this.allQuery);
   	 		}

    	   	this.setValue(this.getCheckedValue());
    	   	
        	this.fireEvent('select', this, record, index);

        }
	},
	setValue:function(v) {
   		if(v) {
    		v = '' + v;
    		if(this.valueField) {
     			this.store.clearFilter();
     			this.store.each(function(r) {
      				var checked = !(!v.match(
       					'(^|' + this.separator + ')' + RegExp.escape(r.get(this.valueField))
       					+'(' + this.separator + '|$)'));

      				r.set(this.checkField, checked);
     			}, this);
     			this.value = this.getCheckedValue();
     			this.setRawValue(this.getCheckedDisplay());
     			if(this.hiddenField) {
      				this.hiddenField.value = this.value;
     			}
    		}  else {
     			this.value = v;
     			this.setRawValue(v);
     			if(this.hiddenField) {
      				this.hiddenField.value = v;
     			}
    		}
    		if(this.el) {
     			this.el.removeClass(this.emptyClass);
    		}
   		} else {
    		this.clearValue();
   		}
	},
	selectAll:function() {
        this.store.each(function(record){
            record.set(this.checkField, true);
        }, this);

        this.doQuery(this.allQuery);
        this.setValue(this.getCheckedValue());
    },
    //重写beforeBlur，否则无法多选
    beforeBlur:function(){}
});

/**
 * @class Boss.Ext.Tree
 * @extends Ext.tree
 * 简化 Boss.Ext.Tree实现
 */
Boss.Ext.Tree = Ext.extend(Ext.tree.TreePanel,{
	/**
	 * 构造函数
	 * @param {} cfg
	 */
	constructor:function(cfg){
		this.cfg = cfg;
		Ext.apply(this, cfg);
		var loader = new Ext.tree.TreeLoader();
		var root = new Ext.tree.AsyncTreeNode({
				id : '0',
				draggable : false,
				text:cfg.rootText,
				children:cfg.treeData
			});	
		if (cfg.dataUrl != undefined)
		{
			loader = new Ext.tree.TreeLoader({dataUrl:cfg.dataUrl});
		};
		Boss.Ext.Tree.superclass.constructor.call(this,{
			loader : loader,
			useArrows: true,
		    autoScroll: true,
		    animate: true,
		    enableDD: true,
		    containerScroll: true,
		    border: false,
		    root:root
		});
	}
});

//=========================================

/**
 * @class Boss.Ext.CheckboxTree
 * @extends Ext.tree.TreePanel
 * 多选框树，结合Structs异步获取数据
 * <pre><code>
 * var cfg = {
 *					rootText : config.orgName,
 *					rootId : config.orgId,
 *					rootVisible:true,
 *					dataUrl : url,
 *					dataKey:'unusedOrgList',
 *					defaultSelect : false
 *				};
 *		if (config.checked != undefined){
 *			cfg.checked = config.checked;
 *		}
 *		this.treeOrg = new Boss.Ext.CheckboxTree(cfg);
 * </code></pre>
 */
Boss.Ext.CheckboxTree = Ext.extend(Ext.tree.TreePanel,{   
 	/**
	 * 用于记录修改日志（主要用于弹出窗口中的多选框树的选中日志）,需要先调用setUpdLog，才能正确获得此值
	 * @type String
	 * @property
	 */
	updLog : '',
	
	logJson : {},
	
	/**
 	 * 构造函数
 	 * @param {Json} cfg  配置参数，格式：<br>
 	 * 		{ <br>
 	 * 			dataUrl:URL<br>
 	 * 			dataKey:返回的Json数据中的数据项属性<br>
 	 * 			nodeText: 返回数据项中显示的节点字段属性<br>
 	 * 			rootId : 根ID<br>
 	 * 			rootVisible：根是否可见<br>
 	 * 			checked : 根是否选中<br>
 	 * 			rootText:  根标题<br>
 	 * 			cascade:  是否级联选择<br>
 	 * 		}<br>
 	 */
	constructor: function(cfg){
		
		var myTreeLoader;
		
		if (cfg.dataUrl != undefined){
			myTreeLoader = new Ext.tree.TreeLoader({  
             	dataUrl:cfg.dataUrl
     		});
		} else {
			myTreeLoader = new Ext.tree.TreeLoader();
		}
		
		//获取Structs 返回的树数据
		myTreeLoader.processResponse = function(response,node,callback){
			var json = response.responseText;
			try{
				var json = eval('('+json+')');
				node.beginUpdate();
				var o = json[cfg.dataKey];
				for(var i= 0,len=o.length;i<len;i++){
				
					var n = this.createNode({
						id:o[i].id,
						text:eval('o[i].'+cfg.nodeText),
						leaf:o[i].leafFlag==1?true:false,checked:false
					});
					if (n){
						node.appendChild(n);
					}
				}
				node.endUpdate();
				if(typeof callback == 'function'){
					callback(this,node);
				}
			} catch(e){
				this.handleFailure(response);
			}
		};
     	
     	myTreeLoader.on("beforeload", function(treeLoader, node) {
 	        treeLoader.baseParams.check = node.attributes.checked;
        	treeLoader.baseParams.id=node.id;
   		}, this);
    	
   		var paramRootNode = {
 	            text:cfg.rootText,
     			draggable:false,
     			id : cfg.rootId
	        };
	    
	    if (cfg.checked != undefined){
	    	paramRootNode.checked = cfg.checked;
	    };
	    
   		var rootNode = new Ext.tree.AsyncTreeNode(paramRootNode);
   		
    	Boss.Ext.CheckboxTree.superclass.constructor.call(this,{  
        	animate:false,
 	        enableDD:false,
 	        autoScroll:true,
 	        useArrows:true,
 	        containerScroll:true,
        	draggable:false,
        	dropConfig: {appendOnly:true},
        	rootVisible : cfg.rootVisible,
        	root : rootNode,
        	loader:myTreeLoader
    	});
    	
    	var ParentState = function(parentNode){
			    var brothNodes=null;
			    if(parentNode!=null) // 兄弟接点
					brothNodes=parentNode.childNodes;
			    else return false;
			    var brothflag=0;                
			    for(var i=0;i<brothNodes.length;i++){  
				    var brothNode=brothNodes[i];  
				    if(brothNode.attributes.checked){  
				 		break;  
				    } else  brothflag++;
			    }          
			    if(brothflag==brothNodes.length){ 
		        	if(parentNode.attributes.checked)
		            	parentNode.ui.toggleCheck();
		            ParentState(parentNode.parentNode);
			    }
		};
		
    	var childbool=true;
    	new Ext.tree.TreeSorter(this,{folderSort:true});
    	if (cfg.cascade){
	    	this.on({
				'checkchange':function(node,checked){  
					var parentNode=node.parentNode;  
		            if(checked){                 
			            if(childbool){ 
			            	var childNodes=node.childNodes;  
			                for(var i=0;i<childNodes.length;i++){  
			                	var childNode=childNodes[i];  
			                    if(!childNode.attributes.checked){  
									childNode.ui.toggleCheck();  
			                    }  
			         
							}
						}
		
		                if(parentNode&&!parentNode.attributes.checked){ 
		                     childbool=false;
		                     parentNode.ui.toggleCheck();                   
		                }
		                else  childbool=true;
		            }else{  
		                ParentState(parentNode);
		                var childNodes=node.childNodes;  
		                for(var i=0;i<childNodes.length;i++){  
		                    var childNode=childNodes[i];  
		                    if(childNode.attributes.checked){  
		                        childNode.ui.toggleCheck();  
		                    }  
		                }     
		            }  
		        }  
	    	});
    	}
	},
	/**
	 * 获取选择节点的id，多个id之间用逗号分隔
	 * @return {String}
	 */
	getSelectedIds:function(){
		var s = '';
		var selNodes = this.getChecked();
		Ext.each(selNodes, function(node){
					s += node.id;
					s += ',';
				});
		s = s.substring(0,s.length-1);
		return s;
	},
	/**
	 * 获取修改日志,主要指选中添加操作日志
	 * @param {} fk1  外键名，待插入数据表中的外键，1*表
	 * @param {} fk2  外键名，待插入数据表中的外键，n*表
	 * @param {} fk1value  fk1对应的字段值
	 */
	setUpdLog:function(fk1,fk2,fk1value){
		this.updLog = '';
		var self = this;
		var selNodes = this.getChecked();
		if(selNodes.length == 0){
			return;
		}
		
		var dataArray = [];
		Ext.each(selNodes, function(node){
			var json = {id:'->0'};
			eval('json.'+fk1+'='+fk1value);
			eval('json.'+fk2+'='+node.id);
			dataArray.push(json);
		});
		this.logJson = {crud:bundle.getMsg('com.label.add'),table:'',data:dataArray};
		this.updLog = Ext.encode([this.logJson]);
	}
});

/**
 * @class Boss.Ext.RadioBoxSelectionModel
 * @extends Ext.grid.RowSelectionModel
 * Grid的单选模式，被Boss.Ext.Grid使用，需要增加CSS：<br>
 * {.x-grid3-row-radio,.x-grid3-hd-radio{width:100%;height:18px;background-position:2px 2px;background-repeat:no-repeat;background-color:transparent;background-image:url(row-radio-sprite.gif);}
 * .x-grid3-row .x-grid3-row-radio { background-position:2px 2px;}
 * .x-grid3-row-selected .x-grid3-row-radio, .x-grid3-hd-checker-on .x-grid3-hd-radio { background-position:-23px 2px;}
 * .x-grid3-hd-radio {  background-position:2px 3px;}
 * .x-grid3-hd-checker-on .x-grid3-hd-radio { background-position:-23px 3px;}}
 */
Boss.Ext.RadioBoxSelectionModel = Ext.extend(Ext.grid.RowSelectionModel, {
    //header: '<div class="x-grid3-hd-radio">&#160;</div>',
    header:null,
    singleSelect:true,
    width: 20,
    sortable: false,
	menuDisabled:true,
    fixed:true,
    dataIndex: '',
    id: 'checker',
    // private
    initEvents : function(){
        Boss.Ext.RadioBoxSelectionModel.superclass.initEvents.call(this);
        this.grid.on('render', function(){
            var view = this.grid.getView();
            view.mainBody.on('mousedown', this.onMouseDown, this);
        }, this);
    },
    // private
    onMouseDown : function(e, t){
        if(e.button === 0 && t.className == 'x-grid3-row-radio'){ // Only fire if left-click
            e.stopEvent();
            var row = e.getTarget('.x-grid3-row');
            if(row){
                var index = row.rowIndex;
                if(this.isSelected(index)){
                  //  this.deselectRow(index);
                }else{
                    this.selectRow(index, true);
                }
            }
        }
    },
    // private
    renderer : function(v, p, record){
        return '<div class="x-grid3-row-radio">&#160;</div>';
    }
});




/**
 * @class Boss.Ext.EditGrid
 * @extends Ext.grid.EditorGridPanel
 * 实现对Boss.Ext.EditGrid的封装，主要简化数据请求操作
 */
Boss.Ext.EditGrid = Ext.extend(Ext.grid.EditorGridPanel,{
	/**
	 * store的副本，在装载数据完成后，需要调用setDuplicateStore方法对第一次加载的数据进行拷贝
	 * @type Ext.data.Store
	 * @property
	 */
	duplicateStore:null,
	/**
	 * 用于记录修改日志,需要先调用setUpdLog，<br>
	 * 修改结束后，然后调用setUpdLog，才能正确获得此值
	 * @type String
	 * @property
	 */
	updLog : '',
	
	/**
	 * 日志Json对象，实现增加属性的功能，需要先调用setUpdLog，<br>
	 * 然后通过Ext.encode([logJson])获取日志进行提交
	 * @type Json 
	 */
	logJson :{},
	
	/**
	 * 构造函数
	 * @param {} cfg:配置项，格式：{	<B>Data</B>:本地数据,<br>
	 * 								<B>url</B>:远程数据请求URL<br>
	 * 								<B>root</B>:  填充数据项，通常对应Java一个List对象<br>
	 * 								<B>columns</B>:表格列，格式参考Ext.grid.ColumnModel,增加type项<br>
	 * 								<B>header</B>:boolean,  //标题是否可见<br>
	 * 								<B>title</B>:string,	//标题<br>
	 * 								<B>mulselect</B>:boolean, //是否允许多选，ture:多选框，false：单选框，不定义：不渲染选择框列<br>
	 * 								<B>hiddenColumns</B>:隐藏列，用于store存储列表外的其他数据<br>
	 * 								<B>textSelect</B>:boolean //表格中的文本是否可选，当通过渲染html的输入框到列时，设置为ture，输入框中的内容可通过鼠标选择，否则不能选择导致操作部方便<br>
	 * 								<B>rownum</B>:boolean //是否显示行号
	 * 								<B>dupStore</B>:boolean //是否在加载数据完成后生成Store的副本，主要用于日志功能<br>
	 * 								<B>tbar</B>：工具栏<br>
	 * 							}
	 */
	constructor:function(cfg){
		var fields = new Array();
		var self = this;
		var gview;
		if (cfg.textSelect){
			gview = new Boss.Ext.GridView();
		}
		for(var i =0;i<cfg.columns.length;i++){
			var AJason = cfg.columns[i];
			if (AJason.mapping != undefined){
				fields.push({name:AJason.dataIndex,mapping:AJason.mapping});
			} else {
				fields.push({name:AJason.dataIndex});
			}
		};
		
		var sm;//选择模型
		if(cfg.sm){
			sm = cfg.sm;
		}else if (cfg.mulselect == true){
			sm = new Ext.grid.CheckboxSelectionModel({handleMouseDown:Ext.emptyFn});
			cfg.columns.unshift(sm);
		} else {
			sm = new Ext.grid.RowSelectionModel({singleSelect:true});
		}
		if (cfg.rownum){
			cfg.columns.unshift(new Ext.grid.RowNumberer());//行号
		}

		//列标题居中
		for(var c=0,ic=cfg.columns.length;c<ic;c++){
			cfg.columns[c].align = 'center';
		}
		
		var cm = new Ext.grid.ColumnModel(cfg.columns);
	
		//加入隐藏列，到Store
		if ( (cfg.hiddenColumns != undefined) && (cfg.hiddenColumns != null) ){
			this.hiddenColumns = cfg.hiddenColumns;
			for(var i =0;i<cfg.hiddenColumns.length;i++){
				var BJason = cfg.hiddenColumns[i];
				if (BJason.mapping != undefined){
					fields.push({name:BJason.dataIndex,mapping:BJason.mapping});
				} else {
					fields.push({name:BJason.dataIndex});
				}
			};
		};
		var ds;
		var Recorder = new Ext.data.Record.create(fields);
	
		if((cfg.url != undefined) && (cfg.url != ''))
		{
			ds = new Ext.data.Store({
				proxy:new Ext.data.HttpProxy({url:cfg.url}),
 				reader: new Ext.data.JsonReader({
						root:cfg.root,
						totalProperty:cfg.total},
						Recorder),
				pruneModifiedRecords:true
			});

    	} else {

			ds = new Ext.data.Store({
				proxy:new Ext.data.MemoryProxy(cfg.data),
				reader:new Ext.data.ArrayReader({},fields),
				pruneModifiedRecords:true
			});

			ds.load();
		};

		Boss.Ext.EditGrid.superclass.constructor.call(this,{
			height:cfg.height,
			stripeRows:true,
			loadMask:true,
			cm:cm,
			sm : sm,
			autoWidth:true,
			store : ds,
			header:cfg.header,
			title:cfg.title,
			clicksToEdit:1,
			view:gview,
			viewConfig:{
				columnsText : bundle.getMsg('com.label.showcolumns'),//'显示列',
				scrollOffset : 30,
				sortAscText : bundle.getMsg('com.label.asc'),//'升序',
				sortDescText : bundle.getMsg('com.label.desc')//'降序'
			},
			tbar:cfg.tbar,
			bbar:cfg.bbar
		});
		ds.on('load',function(){
			if (cfg.dupStore){//生成Store的副本，用于记录日志
				self.setDuplicateStore();
			}
		});
		if (this.getBottomToolbar() != undefined){
			this.getBottomToolbar().style='background-color:#F7F5F4; background-image:url();';
		}
	},
	/**
	 * 查询数据
	 * @param {Json} params，请求参数
	 */
	loadData:function(params){
		this.getStore().lastOptions = {};
		this.getStore().baseParams = params;
		this.getStore().reload();
	},
	/**
	 * 禁用工具栏操作
	 * @param {boolean} disable  true：是，false ：否 
	 */
	disableOperateBar : function(disable){
		this.getTopToolbar().setDisabled(disable);
	},
	/**
	 * 返回更改记录的Json字符串
	 * @return {String} Json格式的字符串，当为''标识没有更改记录
	 */
	getUpdJsonString : function(){
		var tmp = this.getStore().modified.slice(0);
		if (tmp.length == 0){
			return '';
		}
		var jsonArray = [];
		Ext.each(tmp,function(item){
			jsonArray.push(item.data);
		});
		return Ext.encode(jsonArray);
	},
	/**
	 * 获取指定字段组成的Json对象数组
	 * @param {Json} cfgJson 返回Json对象的属性名和字段名对应配置，格式：<br>
	 * 						{<br>
	 * 							属性名:字段名<br>
	 * 							属性名:字段名<br>
	 * 						}
	 * @param (Integer) mode 选择模式 0：选中的记录 1：修改的记录
	 * @return {Array}  Json对象数组
	 */
	getFieldJsonArray :function(cfgJson,mode){
		
		var tmp;
		
		if ((mode) || (mode == 0)){
			tmp = this.getSelectionModel().getSelections();
		} else {
			tmp = this.getStore().modified.slice(0);
		}
		
		if ( (tmp == null) || (tmp.length == 0)){
			return undefined;
		};
		
		var jsonArray = [];
		
		Ext.each(tmp,function(item){
			var data = item.data;
			var tmp = {};
			var s = '';
			for(var a in cfgJson){
				eval('s=cfgJson.'+a);
				eval('tmp.'+a+'=item.get("'+s+'")');
			}
			jsonArray.push(tmp);
		});
		return jsonArray;
	},
	getFieldJsonViewArray :function(cfgJson,mode){
		
		var tmp;
		
		if ((mode) || (mode == 0)){
			tmp = this.getSelectionModel().getSelections();
		} else {
			tmp = this.getStore().modified.slice(0);
		}
		
		if ( (tmp == null) || (tmp.length == 0)){
			return undefined;
		};
		var so = this;
		var jsonArray = [];
		
		Ext.each(tmp,function(item){
			var data = item.data;
			var tmp = {};
			var s = '';
			for(var a in cfgJson){
				eval('s=cfgJson.'+a);
				eval('tmp.'+a+'=item.get("'+s+'")');
			}
			var v = so.getARecViewJson(item);
			Boss.Util.incpJson(v,tmp);
			jsonArray.push(tmp);
		});
		return jsonArray;
	},
	/**
	 *保存Store的副本
	 */
	setDuplicateStore:function(){
		var rs = [];
		this.getStore().each(function(r){
			rs.push(r.copy());
		});
		if (this.duplicateStore == undefined){
			this.duplicateStore = new Ext.data.Store({
				recordType: this.getStore().recordType
			});
		} else {
			this.duplicateStore.removeAll();
		}
		this.duplicateStore.add(rs);
	},
	/**
	 * 获得DataIndex和Header的Json对象
	 * @return {Json}
	 */
	getDataIndexHeader : function(){
		var dh = {};
		var cms = this.getColumnModel(false);
		var icount = cms.getColumnCount(false);
		for(var i=0;i<icount;i++){
			var s1 = cms.getColumnHeader(i);
			var s2 = cms.getDataIndex(i);
			if ( (s2) && (s2.length > 0) ){
				if (s2.toLowerCase() != 'id'){
					var s = 'dh.'+s2+'="'+s1+'"';
					eval(s);
				}
			}
		}
		if (this.hiddenColumns){
			Ext.each(this.hiddenColumns,function(item){
				var s = 'dh.'+item.dataIndex+'="'+item.header+'"';
				eval(s);
			});
		}
		return dh;
	},
	/**
	 * 获取修改日志,包括增加、修改、删除
	 * @param {textField} txtLog UI界面中用于保存修改日志的textField文本框
	 */
	setUpdLog:function(txtLog){
		this.updLog = '';
		var self = this;
		if (this.duplicateStore == undefined){
			return '';
		};

		var sreturn = '';
		var rec0 = null;
		
		var jsonArrayInsert = [];
		var jsonArrayDelete = [];
		var jsonArrayUpdate = [];
		
		//增加、修改的记录
		this.getStore().each(function(rec){
			rec0 = self.duplicateStore.getById(rec.get('id'));
			if( rec0 == undefined){
				jsonArrayInsert.push(rec.data); //新增记录
			} else if (rec.modified) {
				var tmp = {id:rec.get('id')};
				for (key in rec.modified){
					eval('tmp.'+key+'="'+rec0.get(key)+'->'+rec.get(key)+'"');
				};
				jsonArrayUpdate.push(tmp);
			}
		});
		
		//删除的记录
		this.duplicateStore.each(function(rec){
			if (self.getStore().getById(rec.get('id')) == undefined){
				jsonArrayDelete.push(rec.data);
			}
		});
		var jsonArray = [];
		if (jsonArrayInsert.length > 0){
			var json = {
				crud : bundle.getMsg('com.label.add'),
				table:'',
				data : jsonArrayInsert,
				encn : this.getDataIndexHeader()
			};
			jsonArray.push(json);
		};
		if (jsonArrayUpdate.length > 0){
			var json = {
				crud : bundle.getMsg('com.label.edit'),
				table:'',
				data : jsonArrayUpdate,
				encn : this.getDataIndexHeader()
			};
			jsonArray.push(json);
		};
		
		if (jsonArrayDelete.length > 0){
			var json = {
				crud : bundle.getMsg('com.label.delete'),
				table:'',
				data : jsonArrayDelete,
				encn : this.getDataIndexHeader()
			};
			jsonArray.push(json);
		};
		
		if (jsonArray.length > 0){
			this.updLog = Ext.encode(jsonArray);
		};
		if (txtLog != undefined){
			txtLog.setValue(this.updLog);
		}
	},
	/**
	 * 获取某一记录的行号
	 * @param {} rec
	 * @return {}
	 */
	getRowNum : function(rec){
		return this.getStore().indexOf(rec);
	},
	getARowViewJson : function(rownum){
		var cms = this.getColumnModel(false);
		var ic = cms.getColumnCount(false);
		var gv = this.getView();
		var result = {};
		for (var i=0;i<ic;i++){
			var s2 = cms.getDataIndex(i);
			var cell = gv.getCell(rownum,i);
			var div = cell.childNodes[0]; 
			var s = Boss.Util.getHtmlElementValue(div);
			if (s && s.length > 0 && s2.length > 0){
				var ss = 'result.'+s2+'="'+s+'"';
				eval(ss);
			}
		}
		return result;
	},
	getARecViewJson:function(rec){
		var rn = this.getRowNum(rec);
		return this.getARowViewJson(rn);
	}
});

/**
 * @class Boss.Ajax
 * @extends Object
 * 简化Ext.Ajax.request调用
 * <pre><code>
 * var params = {
 * 			id : id,
 * 			data : self.gridPrd.getSelectedJSON()
 * 		};
 * var BossAjax = new Boss.Ajax();
 * 		BossAjax.request({
 * 			url:'chrgItemDefinitionAction.saveChrgItemProdRel.exec.action',
 *			params : params,
 * 			success : function(respJson){
 * 				self.close();
 * 				mainUI.gridProduct.getStore().load();
 * 			}
 * 		}); 
 * </code></pre>
 */
Boss.Ajax = function(){
	/**
	 * 提交请求
	 * @param {Json} cfg 请求参数，格式：{<br>
	 * 										<B>url</B>:请求Action<br>
	 * 										<B>params</B>:请求参数<br>
	 * 										<B>success</B>:请求成功后回调函数<br>
	 * 									}
	 */
	this.request = function(cfg){
		Ext.Ajax.request({
				url:cfg.url,
				params:cfg.params,
				success:function(resp,opts){
					var aJason = Ext.util.JSON.decode(resp.responseText);
					if (aJason.success){
						Boss.Util.msgAlert(bundle.getMsg('com.messages.save.success'));//('系统提示','保存成功');
						if (cfg.success){
							cfg.success(aJason);
						}
					} else {
						Boss.Util.msgError(bundle.getMsg('com.messages.save.failure')+':'+aJason.msg);//('系统提示','保存失败');
					}
				},
				failure:function(resp,opts){
					Boss.Util.msgError(bundle.getMsg('com.messages.save.failure')+':'+aJason.msg);//('系统提示','保存失败');
				}
			});
	};
};

/**
 * @class Boss.Util
 * 提供一些通用的静态函数，不需要进行Boss.Uitl对象的创建，直接通过Boss.Util.Method()
 */
Boss.Util = {
	/**
	 * 数据提交请求
	 * @param {Json} cfg 请求参数，格式：{<br>
	 * 										<B>url</B>:请求Action<br>
	 * 										<B>params</B>:请求参数<br>
	 * 										<B>success</B>:请求成功后回调函数<br>
	 * 									}
	 */
	ajaxRequest : function(cfg){
		Ext.Ajax.request({
				url:cfg.url,
				params:cfg.params,
				success:function(resp,opts){
					var aJason = Ext.util.JSON.decode(resp.responseText);
					if (aJason.success){
						Boss.Util.msgAlert(bundle.getMsg('com.messages.save.success'),{fn:cfg.success});//('系统提示','保存成功');
//						if (cfg.success){
//							cfg.success(aJason);
//						}
					} else {
						Boss.Util.msgError(bundle.getMsg('com.messages.save.failure')+aJason.msg);//('系统提示','保存失败');
					}
				},
				failure:function(resp,opts){
					Boss.Util.msgError(bundle.getMsg('com.messages.save.failure')+aJason.msg);//('系统提示','保存失败');
				}
			});
	},
	/**
	 * 对象拷贝,该拷贝只实现对象属性的拷贝，不包括对象的方法
	 * @param {} Obj  源对象
	 * @return {Object}  对象副本
	 */
	clone : function(Obj){
		var json = Ext.encode(Obj);
		return Ext.decode(json);
	},
	/**
	 * 把一个Json对象的属性依次加入到一个Json对象数组中的Json对象中
	 * @param {} jsonArray  Json对象数组
	 * @param {} source     Json对象
	 */
	incpJsonArray : function(jsonArray,source){
		var array = new Array();
		for(var i=0,ic=jsonArray.length;i<ic;i++){
			var obj = Boss.Util.clone(jsonArray[i]);
			for(var a in source){
				eval('obj.'+a+'=source.'+a);
			}
			array.push(obj);
		}
		return array;
	},
	incpJson : function(s,d){
		for(var a in s){
				if (a != 'id'){
					eval('d.'+a+'=s.'+a);
				}
			}
	},
	/**
	 * 统计Json对象的属性和方法个数
	 * @param {Json} Json Json对象
	 * @return {Integer}
	 */
	countJsonAttr : function(Json){
		var i = 0;
		for(var a in Json){
			i++;
		}
		return i;
	},
	/**
	 * 系统提示框，用于正常信息提示
	 * @param {String} msg 提示信息
	 * @param {Json} fncfg 执行函数Json对象，格式：<br>
	 * 					{<br>
	 * 						fn : function(){} <br>
	 * 					}<br>
	 */
	msgAlert : function(msg,fncfg){
		var show = {
			title: bundle.getMsg('com.messages.title.sysNotice'),//'系统提示',
           	msg: msg,
           	buttons: Ext.MessageBox.OK,
           	icon: Ext.MessageBox.INFO
		};
		if (fncfg){
			show.fn = fncfg.fn;
		};
		Ext.Msg.show(show);
	},
	/**
	 * 错误提示框，用于操作失败信息提示
	 * @param {String} msg 错误提示信息
	 * @param {Json} fncfg 执行函数Json对象，格式：<br>
	 * 					{<br>
	 * 						fn : function(){} <br>
	 * 					}<br>
	 */
	msgError : function(msg,fncfg){
		var show = {
			title: bundle.getMsg('com.messages.title.sysErrorNotice'),//'错误提示',
           	msg: msg,
           	buttons: Ext.MessageBox.OK,
           	icon: Ext.MessageBox.ERROR
		};
		if (fncfg){
			show.fn = fncfg.fn;
		};
		Ext.Msg.show(show);
	},
	/**
	 * 确认操作提示框
	 * @param {Json} cfg 格式：<br>{ <br>
	 * 								msg : 提示信息<br>
	 * 								fn  ：选择是，执行的函数Json对象，格式：fn : function(){pro(p1,p2)} <br>
	 * 							}<br>
	 */
	msgConfirm:function(cfg){
		Ext.Msg.confirm(bundle.getMsg('com.messages.title.sysConfirmNotice'),cfg.msg,function(btn){ //'确认操作'
			if (btn == 'yes'){
				if(cfg.fn){
					cfg.fn();
				}
			}
		});
	},
	/**
	 *时间转换函数,根据ie的不同处理-和/，ie时间格式不支持-，只支持/
	 *@param dateStr  时间字符串
	 *@param orgFormat 需要转换的格式 Y-m-d H:i:s  Y/m/d H:i:s   Y-m-d  Y/m/d
	 *@return String
	*/
	regularDateStr : function(dateStr,format){
		if(dateStr!=null && Ext.util.Format.trim(dateStr)!="" && dateStr!='null'){
		   var dt;
		   if(navigator.userAgent.indexOf("MSIE")>0) {
			   if(dateStr instanceof Date){
				   //do none now
			   }else{
				   if(dateStr.indexOf("-")>=0){
					   dateStr = dateStr.replace("-","/");
				   }
			   }
			   if(format != 'Y-m-d' && format != 'Y/m/d'){
			   	  dt = new Date(dateStr).add(Date.HOUR,-1);
			   }else{
			   	  dt = new Date(dateStr);
			   }
			   dt = Ext.util.Format.date(dt,format);
		   }else{
			   dt = Ext.util.Format.date(dateStr,format);
		   }
		   return dt;
		}else{
			return dateStr;
		}
	},
	/**
	 * 获取字符串长度，包括汉字处理
	 * @param {String} strTemp
	 * @return {Integer}
	 */
	getStrLength: function (strTemp) {
		var i, sum;
		sum = 0;
		for (i = 0; i < strTemp.length; i++) {
			if ((strTemp.charCodeAt(i) >= 0) && (strTemp.charCodeAt(i) <= 255))
				sum = sum + 1;
			else
				sum = sum + 2;
		}
		return sum;

	},
	/**
	 * 返回一个HtmlElement中包含的值
	 * @param {} htmlE
	 * @return {}
	 */
	getHtmlElementValue:function(htmlE){
		var he = htmlE;
		while ((he.nodeType == '1') && (he.hasChildNodes())){
			he = he.childNodes[0];
		}
		return he.nodeValue;
	},
	jsonContainAttr:function(json){
		var b = false;
		
	},
	openUrlDlg : function(theURL,winName,Height,width) {
		window.showModalDialog(theURL,winName,"dialogHeight: "+Height+"px; dialogWidth: "+width+
    	                       "px; dialogTop: px; dialogLeft: px; edge: Raised; center: Yes; help: No; resizable: No; status: No;");
    },
    openUrl : function(theURL,winName,Height,width){
    	var w = window.open(theURL);
    	w.focus();
    },
	valueConverter : function(oldValue,field){
		//add by wangsong
        if(oldValue==0){
	       if("miniValue"==field || "flow"==field){
	           oldValue = ' ';
	       }
	       if("bookBalance"==field || "servType"==field || "note"==field){
	           oldValue = ' ';
	       }
        }
        if (oldValue = ' '){
        	oldValue = '';
        }
        return oldValue;
        //add by wangsong 
	},
	reqActionJson:function(actUrl){
		var aa;
		Ext.Ajax.request({
				url:actUrl,
				async:false,
				success:function(resp,opts){
					var aJason = Ext.util.JSON.decode(resp.responseText);
					if (aJason.success){
						aa=aJason;
						
					} else {
						Boss.Util.msgError(bundle.getMsg('com.messages.save.failure')+aJason.msg);//('系统提示','保存失败');
					}
				},
				failure:function(resp,opts){
					Boss.Util.msgError(bundle.getMsg('com.messages.save.failure')+aJason.msg);//('系统提示','保存失败');
				}
			});
		return aa;
	},
	detectPlugin : function(CLSID,functionName){ 
    	var pluginDiv = document.createElement("<div id=\"pluginDiv\" style=\"display:none\"></div>") 
    	document.body.insertBefore(pluginDiv); 
    	pluginDiv.innerHTML = '<object id="xprint" classid="CLSID:'+ CLSID +'"></object>'; 
    	try 
    	{ 
        	if( (eval("xprint." + functionName) == undefined ) || (eval("xprint." + functionName) == "") )
        	{ 
           	 	pluginDiv.removeNode(true);
            	return false; 
        	} 
        	else
        	{
            	pluginDiv.removeNode(true);
            	return true; 
        	}
    	} 
    	catch(e) 
    	{
        	return false; 
    	} 
	}
};

Ext.reg('BossExtForm', Boss.Ext.Form);
Ext.reg('BossExtEditGrid',Boss.Ext.EditGrid);
Ext.reg('BossExtGrid',Boss.Ext.Grid);
Ext.reg('BossExtWin',Boss.Ext.Window);
Ext.reg('BossExtCheckboxTree',Boss.Ext.CheckboxTree);
Ext.reg('BossExtComboBox',Boss.Ext.ComboBox);
