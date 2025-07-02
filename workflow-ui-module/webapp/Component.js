sap.ui.define(
    [
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "workflowuimodule/model/models",
    ],
    function (UIComponent, Device, models) {
        "use strict";

        return UIComponent.extend(
            "workflowmanagement.workflowuimodule.Component",
            {
                metadata: {
                    manifest: "json",
                },

                /**
                * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
                * @public
                * @override
                */
                init: function () {
                    // call the base component's init function
                    UIComponent.prototype.init.apply(this, arguments);

                    // enable routing
                    this.getRouter().initialize();

                    // set the device model
                    this.setModel(models.createDeviceModel(), "device");

                    this.setTaskModels();

                    const rejectOutcomeId = "reject";
                    this.getInboxAPI().addAction(
                        {
                            action: rejectOutcomeId,
                            label: "Reject",
                            type: "reject",
                        },
                        function () {
                            this.completeTask(false, rejectOutcomeId);
                        },
                        this
                    );
                    const approveOutcomeId = "approve";
                    this.getInboxAPI().addAction(
                        {
                            action: approveOutcomeId,
                            label: "Approve",
                            type: "accept",
                        },
                        function () {
                            debugger
                            var oRootControl = this.getRootControl();
                            var oTextArea = oRootControl.byId("commentInput");

                            // Initialize the flag
                            let canProceed = true;
                            let sCommentText = "";

                            if (oTextArea) {
                                sCommentText = oTextArea.getValue().trim(); // Trim leading/trailing whitespace

                                if (!sCommentText) {
                                    sap.m.MessageToast.show("Comment is required to proceed.");
                                    oTextArea.setValueState(sap.ui.core.ValueState.Error);
                                    canProceed = false;
                                } else {
                                    oTextArea.setValueState(sap.ui.core.ValueState.None);

                                    // ✅ Escape single quotes (') by replacing them with two single quotes ('')
                                    const escapedText = sCommentText.replace(/'/g, "''");
                                    debugger
                                    // ✅ Wrap with single quotes ONLY if not already quoted
                                    if (!/^'.*'$/.test(escapedText)) {
                                        debugger
                                        sCommentText = `'${escapedText}'`;
                                    } else {
                                        sCommentText = escapedText;
                                    }

                                    console.log("Formatted quoted comment:", sCommentText);
                                }
                            }

                            if (canProceed) {
                                debugger
                                // ✅ Set the safely quoted comment to the context model
                                this.getModel("context").setProperty("/comment", sCommentText);

                                // Complete the task
                                this.completeTask(true, approveOutcomeId);
                            }

                        },
                        this
                    );
                },

                setTaskModels: function () {
                    // set the task model
                    var startupParameters = this.getComponentData().startupParameters;
                    this.setModel(startupParameters.taskModel, "task");

                    // set the task context model
                    var taskContextModel = new sap.ui.model.json.JSONModel(
                        this._getTaskInstancesBaseURL() + "/context"
                    );
                    this.setModel(taskContextModel, "context");
                },

                _getTaskInstancesBaseURL: function () {
                    return (
                        this._getWorkflowRuntimeBaseURL() +
                        "/task-instances/" +
                        this.getTaskInstanceID()
                    );
                },

                _getWorkflowRuntimeBaseURL: function () {
                    var ui5CloudService = this.getManifestEntry("/sap.cloud/service").replaceAll(".", "");
                    var ui5ApplicationName = this.getManifestEntry("/sap.app/id").replaceAll(".", "");
                    var appPath = `${ui5CloudService}.${ui5ApplicationName}`;
                    return `/${appPath}/api/public/workflow/rest/v1`

                },

                getTaskInstanceID: function () {
                    return this.getModel("task").getData().InstanceID;
                },

                getInboxAPI: function () {
                    var startupParameters = this.getComponentData().startupParameters;
                    return startupParameters.inboxAPI;
                },

                completeTask: function (approvalStatus, outcomeId) {
                    this.getModel("context").setProperty("/approved", approvalStatus);
                    this._patchTaskInstance(outcomeId);
                },

                _patchTaskInstance: function (outcomeId) {
                    const context = this.getModel("context").getData();
                    var data = {
                        status: "COMPLETED",
                        context: { ...context, comment: context.comment || '' },
                        decision: outcomeId
                    };

                    jQuery.ajax({
                        url: `${this._getTaskInstancesBaseURL()}`,
                        method: "PATCH",
                        contentType: "application/json",
                        async: true,
                        data: JSON.stringify(data),
                        headers: {
                            "X-CSRF-Token": this._fetchToken(),
                        },
                    }).done(() => {
                        this._refreshTaskList();
                    })
                },

                _fetchToken: function () {
                    var fetchedToken;

                    jQuery.ajax({
                        url: this._getWorkflowRuntimeBaseURL() + "/xsrf-token",
                        method: "GET",
                        async: false,
                        headers: {
                            "X-CSRF-Token": "Fetch",
                        },
                        success(result, xhr, data) {
                            fetchedToken = data.getResponseHeader("X-CSRF-Token");
                        },
                    });
                    return fetchedToken;
                },

                _refreshTaskList: function () {
                    this.getInboxAPI().updateTask("NA", this.getTaskInstanceID());
                },
            }
        );
    }
);