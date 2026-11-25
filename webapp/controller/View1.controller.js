sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/ui/table/Column",
    "sap/m/Label",
    "sap/m/Text"
], function (
    Controller,
    Filter,
    FilterOperator,
    MessageBox,
    TableColumn,
    Label,
    Text
) {
    "use strict";


    var SELECTION_CODES = {
        chkOrgId: "BOI",   // BP: Organization and ID Number
        chkGeneral: "BGL",   // BP: General
        chkAddress: "BAD",   // BP: Address
        chkAddrType1: "BA1",   // Business Address Type 1
        chkAddrType2: "BA2",   // Business Address Type 2
        chkAddrType3: "BA3",   // Business Address Type 3
        chkTaxNumber: "BTX",   // Tax Number
        chkVendorGen: "BVG",   // Vendor General
        chkCustomerGen: "BCG",   // Customer General
        chkPraVendor: "BPV",   // PRA Vendor
        chkPraCustomer: "BPC"    // PRA Customer
    };


    var TECHNICAL_COLUMNS = [
        { field: "changedocnr" },
        { field: "objecttype" },
        { field: "tablename" },
        { field: "fieldname" }
    ];

    return Controller.extend("cppbpmasterdatachangerpt.controller.View1", {

        onInit: function () {
            // Logo
            var sComponentUrl = sap.ui.require.toUrl("cppbpmasterdatachangerpt");
            this.byId("logo").setSrc(
                sComponentUrl + "/sap/opu/odata/CPP/SB_UI_IMAGE/Image('logo_crawford')/$value"
            );

            this._oSFB = this.byId("smartFilterBar");
            this._oSmartTable = this.byId("mainSmartTable");

            this._oSFB.attachInitialise(this._setDefaultFilters, this);

            if (this._oSmartTable) {
                this._oSmartTable.attachInitialise(function () {
                    var oTable = this._oSmartTable.getTable();
                    if (oTable) {
                        oTable.setSelectionMode(sap.ui.table.SelectionMode.None);
                    }
                }, this
                );
            }


        },


        _setDefaultFilters: function () {
            var oToDate = this._oSFB.getControlByKey("todate");
            var oFromTime = this._oSFB.getControlByKey("fromtime");
            var oToTime = this._oSFB.getControlByKey("totime");

            if (oToDate) {
                if (oToDate.setDateValue) {
                    oToDate.setDateValue(new Date());
                } else {
                    var d = new Date();
                    oToDate.setValue(
                        d.getFullYear() +
                        String(d.getMonth() + 1).padStart(2, "0") +
                        String(d.getDate()).padStart(2, "0")
                    );
                }
            }
            // if (oFromTime) {
            //     oFromTime.setValue("00:00:00");
            // }
            if (oToTime) {
                oToTime.setValue("23:59:59");
            }
        },

        _setAutoResizeColumn: function (oTable) {
            oTable.attachEventOnce("rowsUpdated", function (oEvent) {
                oEvent.getSource().getColumns().forEach(function (oColumn) {
                    if (oColumn.getVisible()) {
                        oColumn.autoResize();
                    }
                });
            });
        },


        onSelectionChange: function () {
            // nothing to do: selections are read on Go
        },


        onTechnicalInfoChange: function (oEvent) {

            var bSelected = oEvent.getParameter("selected");

            this._recreateSmartTable(bSelected);

        },

        _recreateSmartTable: function (bShowTechnicalInfo) {

            var oOldSmartTable = this._oSmartTable;
            var oContainer = this.byId("tableContainerBox");
            if (oOldSmartTable) {

                oOldSmartTable.destroy();
                this._oSmartTable = null;
            }

            var sTechAllFields = "changedocnr,objecttype,bpartnerno,changedby,firstname,lastname,changedon,chgtime,transactioncode,tablename,tabledescription,fieldname,fielddescription,ChgTyp,oldvalue,newvalue";
            var sNormFields = "bpartnerno,changedby,firstname,lastname,changedon,chgtime,transactioncode,tabledescription,fielddescription,ChgTyp,oldvalue,newvalue";
            var sVisibleFields = bShowTechnicalInfo ? sTechAllFields : sNormFields;
            // Create SmartTable using the same ID
            var oNewSmartTable = new sap.ui.comp.smarttable.SmartTable(
                this.createId("mainSmartTable"),
                {
                    entitySet: "xCPPxC_BP_MD_CHNG_RPT",
                    smartFilterId: this._oSFB.getId(),
                    tableType: "Table",
                    enableAutoColumnWidth: true,
                    header: "Business Partner Master Data Change Report",
                    showRowCount: true,
                    enableAutoBinding: false,
                    useVariantManagement: true,
                    useTablePersonalisation: true,
                    persistencyKey: "BP_MD_SMARTTABLE",
                    requestAtLeastFields: sTechAllFields,
                    initiallyVisibleFields: sVisibleFields,
                    beforeRebindTable: this.onBeforeRebindTable.bind(this),
                    height: "100%"
                }
            );


            this._smartTable = oNewSmartTable;
            this._smartTable.setHeight("100%");

            this._smartTable.setLayoutData(
                new sap.m.FlexItemData({
                    growFactor: 1
                })
            );

            var oContainer = this.byId("tableContainerBox");
            oContainer.addItem(this._smartTable);

            this._oSmartTable = this._smartTable;

            this._smartTable.attachInitialise(function () {
                var oTable = this._smartTable.getTable();
                if (oTable) {
                    this._setAutoResizeColumn(oTable);
                }
            }.bind(this));


        },


        _getSelectedCodes: function () {
            return Object.keys(SELECTION_CODES).filter(function (sId) {
                var oCheckBox = this.byId(sId);
                return oCheckBox && oCheckBox.getSelected();
            }.bind(this)).map(function (sId) {
                return SELECTION_CODES[sId];
            });
        },


        // onGoPress: function () {


        //         var oData = this._oSFB.getFilterData();

        //         var dFrom = this._toDate(this._getFilterValue(oData.fromdate));
        //         var dTo = this._toDate(this._getFilterValue(oData.todate));

        //         if (dFrom && dTo) {
        //             if (dFrom.getTime() > dTo.getTime()) {
        //                 MessageBox.error("Date range error");
        //                 return;
        //             }

        //             if (dFrom.getTime() === dTo.getTime()) {
        //                 var iFrom = this._toMs(this._getFilterValue(oData.fromtime));
        //                 var iTo = this._toMs(this._getFilterValue(oData.totime));

        //                 if (iFrom !== null && iTo !== null && iFrom > iTo) {
        //                     MessageBox.error("Time range error");
        //                     return;
        //                 }
        //             }
        //         }

        //         // this._oSmartTable.rebindTable();
        //     }
        onGoPress: function () {
            this._bFromGo = true;
        },
        // Adds the non-SFB filters. SFB filters are added by SmartTable (smartFilterId).
       onBeforeRebindTable: function (oEvent) {
            var oBindingParams = oEvent.getParameter("bindingParams");
            var aFilters = oBindingParams.filters;

            if (this._bFromGo) {
                this._bFromGo = false;

                if (!this._validateSelections()) {
                    oBindingParams.preventTableBind = true;   
                    return;
                }
            }

            var aCodes = this._getSelectedCodes();
            if (aCodes.length) {
                aFilters.push(new Filter({
                    filters: aCodes.map(function (sCode) {
                        return new Filter("chkboxId", FilterOperator.EQ, sCode);
                    }),
                    and: false
                }));
            }

            if (this.byId("displayTechnicalInfo").getSelected()) {
                aFilters.push(new Filter("distechinfochkbox", FilterOperator.EQ, "X"));
            }
        },

        _getFilterValue: function (vFilter) {
            if (!vFilter) {
                return null;
            }
            if (vFilter instanceof Date) {
                return vFilter;
            }
            if (vFilter.ranges && vFilter.ranges.length) {
                return vFilter.ranges[0].value1;
            }
            if (vFilter.items && vFilter.items.length) {
                return vFilter.items[0].key;
            }
            if (vFilter.value !== undefined && vFilter.value !== null) {
                return vFilter.value;
            }
            if (typeof vFilter === "string" || typeof vFilter === "object") {
                return vFilter;
            }
            return null;
        },

        _toDate: function (v) {
            if (!v) {
                return null;
            }
            var d;
            if (v instanceof Date) {
                d = new Date(v.getTime());
            } else if (/^\d{8}$/.test(String(v))) {
                var s = String(v);
                d = new Date(+s.substr(0, 4), +s.substr(4, 2) - 1, +s.substr(6, 2));
            } else {
                d = new Date(v);
            }
            if (isNaN(d.getTime())) {
                return null;
            }
            d.setHours(0, 0, 0, 0);
            return d;
        },

        _toMs: function (v) {
            if (!v) {
                return null;
            }
            if (typeof v === "object" && typeof v.ms === "number") {
                return v.ms;                                   // Edm.Time {ms: ...}
            }
            if (v instanceof Date) {
                return ((v.getHours() * 60 + v.getMinutes()) * 60 + v.getSeconds()) * 1000;
            }
            var a = String(v).split(":");
            if (a.length >= 2) {
                return ((+a[0] * 60 + +a[1]) * 60 + (+a[2] || 0)) * 1000;
            }
            return null;
        },
        _validateSelections: function () {
            if (this._getSelectedCodes().length === 0) {
                MessageBox.error("Please make at least one Business Partner Change Selection.");
                return false;
            }

            var oData = this._oSFB.getFilterData();
            var dFrom = this._toDate(this._getFilterValue(oData.fromdate));
            var dTo = this._toDate(this._getFilterValue(oData.todate));

            if (dFrom && dTo) {
                if (dFrom.getTime() > dTo.getTime()) {
                    MessageBox.error("Date range error");
                    return false;
                }
                if (dFrom.getTime() === dTo.getTime()) {
                    var iFrom = this._toMs(this._getFilterValue(oData.fromtime));
                    var iTo = this._toMs(this._getFilterValue(oData.totime));
                    if (iFrom !== null && iTo !== null && iFrom > iTo) {
                        MessageBox.error("Time range error");
                        return false;
                    }
                }
            }
            return true;
        },
    });
});