const $ = require('jquery');
require('jquery.fancytree');
require('jquery.fancytree/dist/modules/jquery.fancytree.dnd5.js');
require('jquery.fancytree/dist/modules/jquery.fancytree.edit.js');
require('jquery.fancytree/dist/modules/jquery.fancytree.gridnav.js');
require('jquery.fancytree/dist/modules/jquery.fancytree.table.js');
require('jquery.fancytree/dist/modules/jquery.fancytree.filter.js');
require('ui-contextmenu');

// $('#tree').fancytree({
//     skin: 'skin-win8',
//     source: [
//         {title: 'Node 1',key: '1'},
//         {title: 'Node 2', children: [
//             {title: 'Subnode 2.1'},
//             {title: 'Subnode 2.2'}
//         ]}
//       ],
// });

//   var tree = $.ui.fancytree.getTree("#tree");

//   // Expand all tree nodes
//   tree.visit(function(node){
//     node.setExpanded(true);
//   });

// // Get a reference to the node
// const myNode = tree.getNodeByKey('1');

// // Check if the node exists before adding children
// if (myNode) {
//   myNode.addChildren([{ title: 'Child Node 3' }, { title: 'Child Node 4' }]);
// }


    var CLIPBOARD = null;

      $(function() {
        $("#tree")
          .fancytree({
            activeVisible: true, // Make sure, active nodes are visible (expanded)
            aria: true, // Enable WAI-ARIA support
            autoActivate: true, // Automatically activate a node when it is focused using keyboard
            autoCollapse: false, // Automatically collapse all siblings, when a node is expanded
            autoScroll: false, // Automatically scroll nodes into visible area
            clickFolderMode: 4, // 1:activate, 2:expand, 3:activate and expand, 4:activate (dblclick expands)
            checkbox: false, // Show check boxes
            checkboxAutoHide: true, // Display check boxes on hover only
            debugLevel: 4, // 0:quiet, 1:errors, 2:warnings, 3:infos, 4:debug
            disabled: false, // Disable control
            focusOnSelect: false, // Set focus when node is checked by a mouse click
            escapeTitles: false, // Escape `node.title` content for display
            generateIds: false, // Generate id attributes like <span id='fancytree-id-KEY'>
            idPrefix: "ft_", // Used to generate node idÂ´s like <span id='fancytree-id-<key>'>
            icon: true, // Display node icons
            keyboard: true, // Support keyboard navigation
            keyPathSeparator: "/", // Used by node.getKeyPath() and tree.loadKeyPath()
            minExpandLevel: 1, // 1: root node is not collapsible
            rtl: false, // Enable RTL (right-to-left) mode
            selectMode: 2, // 1:single, 2:multi, 3:multi-hier
            tabindex: "0", // Whole tree behaves as one single control
            tooltip: false, // Use title as tooltip (also a callback could be specified)
            titlesTabbable: true, // Add all node titles to TAB chain// Node titles can receive keyboard focus
            quicksearch: true, // Jump to nodes when pressing first character///must true for filter 
            
            source: { url: "ajax-tree-products.json" },

            extensions: ["edit", "dnd5", "table", "gridnav", "filter"],

            filter: {
              autoApply: true,   // Re-apply last filter if lazy data is loaded
              autoExpand: false, // Expand all branches that contain matches while filtered
              counter: true,     // Show a badge with number of matching child nodes near parent icons
              fuzzy: false,      // Match single characters in order, e.g. 'fb' will match 'FooBar'
              hideExpandedCounter: true,  // Hide counter badge if parent is expanded
              hideExpanders: false,       // Hide expanders if all child nodes are hidden by filter
              highlight: true,   // Highlight matches by wrapping inside <mark> tags
              leavesOnly: false, // Match end nodes only
              nodata: true,      // Display a 'no data' status node if result is empty
              mode: "dimm"       // Grayout unmatched nodes (pass "hide" to remove unmatched node instead)
            },
        
            lazyLoad: function(event, data) {
              data.result = {url: "ajax-sub2.json"}
            },

            
            dnd5: {
              preventVoidMoves: true,
              preventRecursion: true,
              autoExpandMS: 400,
              dragStart: function(node, data) {
                return true;
              },
              dragEnter: function(node, data) {
                // return ["before", "after"];
                return true;
              },
              dragDrop: function(node, data) {
                data.otherNode.moveTo(node, data.hitMode);
              },
            },
            edit: {
              triggerStart: ["f2", "shift+click", "mac+enter"],
              close: function(event, data) {
                if (data.save && data.isNew) {
                  // Quick-enter: add new nodes until we hit [enter] on an empty title
                  $("#tree").trigger("nodeCommand", {
                    cmd: "addSibling",
                  });
                }
              },
            },
            table: {
              indentation: 20,
              nodeColumnIdx: 2,
              checkboxColumnIdx: 0,
            },
            gridnav: {
              autofocusInput: false,
              handleCursorKeys: true,
            },

            // lazyLoad: function(event, data) {
            //   data.result = { url: "ajax-sub2.json" };
            // },
            createNode: function(event, data) {
              var node = data.node,
                $tdList = $(node.tr).find(">td");

              // Span the remaining columns if it's a folder.
              // We can do this in createNode instead of renderColumns, because
              // the `isFolder` status is unlikely to change later
              if (node.isFolder()) {
                $tdList
                  .eq(2)
                  .prop("colspan", 6)
                  .nextAll()
                  .remove();
              }
            },
            renderColumns: function(event, data) {
              var node = data.node,
                $tdList = $(node.tr).find(">td");

              // (Index #0 is rendered by fancytree by adding the checkbox)
              // Set column #1 info from node data:
              $tdList.eq(1).text(node.getIndexHier());
              // (Index #2 is rendered by fancytree)
              // Set column #3 info from node data:
              $tdList
                .eq(3)
                .find("input")
                .val(node.key);
              $tdList
                .eq(4)
                .find("input")
                .val(node.data.foo);

              // Static markup (more efficiently defined as html row template):
              // $tdList.eq(3).html("<input type='input' value='"  "" + "'>");
              // ...
            },
            modifyChild: function(event, data) {
              data.tree.info(event.type, data);
            },
          })
          .on("nodeCommand", function(event, data) {
            // Custom event handler that is triggered by keydown-handler and
            // context menu:
            var refNode,
              moveMode,
              tree = $.ui.fancytree.getTree(this),
              node = tree.getActiveNode();

            switch (data.cmd) {
              case "addChild":
              case "addSibling":
              case "indent":
              case "moveDown":
              case "moveUp":
              case "outdent":
              case "remove":
              case "rename":
                tree.applyCommand(data.cmd, node);
                break;
              case "cut":
                CLIPBOARD = { mode: data.cmd, data: node };
                break;
              case "copy":
                CLIPBOARD = {
                  mode: data.cmd,
                  data: node.toDict(true, function(dict, node) {
                    delete dict.key;
                  }),
                };
                break;
              case "clear":
                CLIPBOARD = null;
                break;
              case "paste":
                if (CLIPBOARD.mode === "cut") {
                  // refNode = node.getPrevSibling();
                  CLIPBOARD.data.moveTo(node, "child");
                  CLIPBOARD.data.setActive();
                } else if (CLIPBOARD.mode === "copy") {
                  node.addChildren(
                    CLIPBOARD.data
                  ).setActive();
                }
                break;
              default:
                alert("Unhandled command: " + data.cmd);
                return;
            }
          })
          .on("keydown", function(e) {
            var cmd = null;

            // console.log(e.type, $.ui.fancytree.eventToString(e));
            switch ($.ui.fancytree.eventToString(e)) {
              case "ctrl+shift+n":
              case "meta+shift+n": // mac: cmd+shift+n
                cmd = "addChild";
                break;
              case "ctrl+c":
              case "meta+c": // mac
                cmd = "copy";
                break;
              case "ctrl+v":
              case "meta+v": // mac
                cmd = "paste";
                break;
              case "ctrl+x":
              case "meta+x": // mac
                cmd = "cut";
                break;
              case "ctrl+n":
              case "meta+n": // mac
                cmd = "addSibling";
                break;
              case "del":
              case "meta+backspace": // mac
                cmd = "remove";
                break;
              // case "f2":  // already triggered by ext-edit pluging
              //   cmd = "rename";
              //   break;
              case "ctrl+up":
              case "ctrl+shift+up": // mac
                cmd = "moveUp";
                break;
              case "ctrl+down":
              case "ctrl+shift+down": // mac
                cmd = "moveDown";
                break;
              case "ctrl+right":
              case "ctrl+shift+right": // mac
                cmd = "indent";
                break;
              case "ctrl+left":
              case "ctrl+shift+left": // mac
                cmd = "outdent";
            }
            if (cmd) {
              $(this).trigger("nodeCommand", { cmd: cmd });
              return false;
            }
          });

          var tree = $.ui.fancytree.getTree("#tree");

            /*
            * Event handlers for our little demo interface
            */
            $("input[name=search]").on("keyup", function(e){
              var n,
                tree = $.ui.fancytree.getTree(),
                args = "autoApply autoExpand fuzzy hideExpanders highlight leavesOnly nodata".split(" "),
                opts = {},
                filterFunc = $("#branchMode").is(":checked") ? tree.filterBranches : tree.filterNodes,
                match = $(this).val();

              $.each(args, function(i, o) {
                opts[o] = $("#" + o).is(":checked");
              });
              opts.mode = $("#hideMode").is(":checked") ? "hide" : "dimm";

              if(e && e.which === $.ui.keyCode.ESCAPE || $.trim(match) === ""){
                $("button#btnResetSearch").trigger("click");
                return;
              }
              if($("#regex").is(":checked")) {
                // Pass function to perform match
                n = filterFunc.call(tree, function(node) {
                  return new RegExp(match, "i").test(node.title);
                }, opts);
              } else {
                // Pass a string to perform case insensitive matching
                n = filterFunc.call(tree, match, opts);
              }
              $("button#btnResetSearch").attr("disabled", false);
              $("span#matches").text("(" + n + " matches)");
            }).focus();

            $("button#btnResetSearch").click(function(e){
              $("input[name=search]").val("");
              $("span#matches").text("");
              tree.clearFilter();
            }).attr("disabled", true);

            $("fieldset input:checkbox").change(function(e){
                var id = $(this).attr("id"),
                  flag = $(this).is(":checked");

                // Some options can only be set with general filter options (not method args):
                switch( id ){
                case "counter":
                case "hideExpandedCounter":
                  tree.options.filter[id] = flag;
                  break;
                }
                tree.clearFilter();
                $("input[name=search]").keyup();
            });

        /*
         * Tooltips
         */
        // $("#tree").tooltip({
        //   content: function () {
        //     return $(this).attr("title");
        //   }
        // });

        /*
         * Context menu (https://github.com/mar10/jquery-ui-contextmenu)
         */
        $("#tree").contextmenu({
          delegate: "span.fancytree-node",
          menu: [
            {
              title: "Edit <kbd>[F2]</kbd>",
              cmd: "rename",
              uiIcon: "ui-icon-pencil",
            },
            {
              title: "Delete <kbd>[Del]</kbd>",
              cmd: "remove",
              uiIcon: "ui-icon-trash",
            },
            { title: "----" },
            {
              title: "New sibling <kbd>[Ctrl+N]</kbd>",
              cmd: "addSibling",
              uiIcon: "ui-icon-plus",
            },
            {
              title: "New child <kbd>[Ctrl+Shift+N]</kbd>",
              cmd: "addChild",
              uiIcon: "ui-icon-arrowreturn-1-e",
            },
            { title: "----" },
            {
              title: "Cut <kbd>Ctrl+X</kbd>",
              cmd: "cut",
              uiIcon: "ui-icon-scissors",
            },
            {
              title: "Copy <kbd>Ctrl-C</kbd>",
              cmd: "copy",
              uiIcon: "ui-icon-copy",
            },
            {
              title: "Paste as child<kbd>Ctrl+V</kbd>",
              cmd: "paste",
              uiIcon: "ui-icon-clipboard",
              disabled: true,
            },
          ],
          beforeOpen: function(event, ui) {
            var node = $.ui.fancytree.getNode(ui.target);
            $("#tree").contextmenu(
              "enableEntry",
              "paste",
              !!CLIPBOARD
            );
            node.setActive();
          },
          select: function(event, ui) {
            var that = this;
            // delay the event, so the menu can close and the click event does
            // not interfere with the edit control
            setTimeout(function() {
              $(that).trigger("nodeCommand", { cmd: ui.cmd });
            }, 100);
          },
        });
      });










$(function(){
	addSampleButton({
		label: "Disable",
		id: "btnDisable",
		code: function(){
			var tree = $.ui.fancytree.getTree("#tree"),
				wasEnabled = !tree.options.disabled;

			tree.enable(!wasEnabled);
			$("#btnDisable").text(wasEnabled ? "Enable" : "Disable");
		}
	});
	addSampleButton({
		label: "Expand all",
		newline: false,
		code: function(){
			$.ui.fancytree.getTree("#tree").expandAll();
		}
	});
	addSampleButton({
		label: "Collapse all",
		newline: false,
		code: function(){
			$.ui.fancytree.getTree("#tree").expandAll(false);
		}
	});
	addSampleButton({
		label: "Toggle expand",
		code: function(){
			$.ui.fancytree.getTree("#tree").visit(function(node){
				node.toggleExpanded();
			});
		}
	});
	addSampleButton({
		label: "tree.getActiveNode()",
		newline: false,
		code: function(){
			var node = $.ui.fancytree.getTree("#tree").getActiveNode();
			if( node ){
				alert("Currently active: " + node.title);
			}else{
				alert("No active node.");
			}
		}
	});
	addSampleButton({
		label: "tree.toDict()",
		code: function(){
			// Convert the whole tree into an dictionary
			var tree = $.ui.fancytree.getTree("#tree");
			var d = tree.toDict(true);
			alert(JSON.stringify(d));
		}
	});
	addSampleButton({
		label: "activateKey('id4.3.2')",
		code: function(){
			$.ui.fancytree.getTree("#tree").activateKey("id4.3.2");
			// also possible:
//	              $.ui.fancytree.getTree("#tree").getNodeByKey("id4.3.2").setActive();
		}
	});
	addSampleButton({
		label: "setTitle()",
		code: function(){
			var node = $.ui.fancytree.getTree("#tree").getActiveNode();
			if( !node ) return;
			node.setTitle(node.title + ", " + new Date());
			// this is a shortcut for
			// node.fromDict({title: data.node.title + new Date()});
		}
	});
	addSampleButton({
		label: "Sort tree",
		newline: false,
		code: function(){
			var node = $.ui.fancytree.getTree("#tree").getRootNode();
			node.sortChildren(null, true);
		}
	});
	addSampleButton({
		label: "Sort active banch",
		code: function(){
			var node = $.ui.fancytree.getTree("#tree").getActiveNode();
			// Custom compare function (optional) that sorts case insensitive
			var cmp = function(a, b) {
				a = a.title.toLowerCase();
				b = b.title.toLowerCase();
				return a > b ? 1 : a < b ? -1 : 0;
			};
			node.sortChildren(cmp, false);
		}
	});
	addSampleButton({
		header: "Create nodes",
		tooltip: "Use node.addChildren() with single objects",
		label: "Add single nodes",
		newline: false,
		code: function(){
			// Sample: add an hierarchic branch using code.
			// This is how we would add tree nodes programatically
			var rootNode = $.ui.fancytree.getTree("#tree").getRootNode();
			var childNode = rootNode.addChildren({
				title: "Programatically addded nodes",
				tooltip: "This folder and all child nodes were added programmatically.",
				folder: true
			});
			childNode.addChildren({
				title: "Document using a custom icon",
				icon: "customdoc1.gif"
			});
		}
	});
	addSampleButton({
		tooltip: "Use node.appendSibling()",
		label: "Apppend a sibling node",
		newline: false,
		code: function(){
			var tree = $.ui.fancytree.getTree("#tree"),
				node = tree.getActiveNode(),
				newData = {title: "New Node"},
				newSibling = node.appendSibling(newData);
		}
	});
	addSampleButton({
		label: "ROOT.addChildren()",
		tooltip: "Use node.addChildren() with recursive arrays",
		code: function(){
			// Sample: add an hierarchic branch using an array
			var obj = [
				{ title: "Lazy node 1", lazy: true },
				{ title: "Lazy node 2", lazy: true },
				{ title: "Folder node 3", folder: true,
					children: [
						{ title: "node 3.1" },
						{ title: "node 3.2",
							children: [
								{ title: "node 3.2.1" },
								{ title: "node 3.2.2",
									children: [
										{ title: "node 3.2.2.1" }
									]
								}
							]
						}
					]
				}
			];
			$.ui.fancytree.getTree("#tree").getRootNode().addChildren(obj);
		}
	});
	addSampleButton({
		label: "node.fromDict()",
		code: function(){
			var node = $.ui.fancytree.getTree("#tree").getActiveNode();
			if( !node ) return;
			// Set node data and - optionally - replace children
			node.fromDict({
				title: node.title + new Date(),
				children: [{title: "t1"}, {title: "t2"}]
			});
		}
	});
	CLIPBOARD = null;
	addSampleButton({
		label: "Clipboard = node.toDict()",
		newline: false,
		code: function(){
			// Convert active node (and descendants) to a dictionary and store
			// in
			var node = $.ui.fancytree.getTree("#tree").getActiveNode();
			var d = node.toDict(true, function(dict, node){
				// Remove keys, so they will be re-generated when this dict is
				// passed to addChildren()
				delete dict.key;
			});
			// Store in a globael variable
			CLIPBOARD = d;
			alert("CLIPBOARD = " + JSON.stringify(d));
		}
	});
	addSampleButton({
		label: "node.fromDict(Clipboard)",
		code: function(){
			var node = $.ui.fancytree.getTree("#tree").getActiveNode();
			if( !node ) return;
			// Set node data and - optionally - replace children
			node.fromDict(CLIPBOARD);
		}
	});
	addSampleButton({
		label: "Remove selected nodes (but keep children)",
		newline: true,
		code: function(){
			var tree = $.ui.fancytree.getTree("#tree"),
				selNodes = tree.getSelectedNodes();

			selNodes.forEach(function(node) {
				while( node.hasChildren() ) {
					node.getFirstChild().moveTo(node.parent, "child");
				}
				node.remove();
			});
		}
	});




  ///filter buttons
  addSampleButton({
    label: "Filter active branch",
    newline: false,
    code: function(){
      if( !tree.getActiveNode() ) {
        alert("Please activate a folder.");
        return;
      }
      tree.filterBranches(function(node){
        return node.isActive();
      }, {
        mode: "hide",
      });
    }
  });
  addSampleButton({
    label: "Reset filter",
    newline: false,
    code: function(){
      tree.clearFilter();
    }
  });
});