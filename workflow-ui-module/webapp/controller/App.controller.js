sap.ui.define(
  [
    "sap/ui/core/mvc/Controller"
  ],
  function (BaseController) {
    "use strict";

    return BaseController.extend("workflowuimodule.controller.App", {
      onInit() {
        debugger

      },
      onBeforeRendering() {
        debugger
        setTimeout(function () {
          debugger
          var oView = this.getView();
          var oModel = new sap.ui.model.json.JSONModel();
          var oData = oView.oPropagatedProperties.oModels.context?.oData;

          // ✅ Parse stringified file JSON
          if (oData.file) {
            try {
              var parsedFile = JSON.parse(oData.file);  // 🔥 this turns string into object

              // Optionally wrap in array if needed for UploadSet or List
              var fileArray = Array.isArray(parsedFile) ? parsedFile : [parsedFile];
              debugger
              oModel.setData({ pdf: fileArray });
              oView.setModel(oModel, "myFile");

              console.log("✅ File model set:", fileArray);
            } catch (e) {
              console.error("❌ Failed to parse file JSON:", e);
            }
          } else {
            console.error("❌ file field missing in context data.");
          }
        }.bind(this), 1000);



        setTimeout(() => {
          debugger
          var oView = this.getView();
          var oData = oView.oPropagatedProperties.oModels.context?.oData;

          if (!oData) {
            console.warn("No data available in context.");
            return;
          }
          var rawCommentData = oData.Comments;
        
          try {
            // Safely parse the JSON string
            var commentsData = JSON.parse(rawCommentData);
        
            if (Array.isArray(commentsData)) {
              // ❌ Filter out comments starting with 10 digits
              var filteredComments = commentsData.filter(comment =>
                !/^\d{10}/.test(comment.commentsText)
              );
        
              // ✅ Bind filtered comments to model
              var oModelComments = new sap.ui.model.json.JSONModel({ Comments: filteredComments });
              oView.setModel(oModelComments, "myComments");
              debugger
              console.log("✅ Filtered Comments:", filteredComments);
        
              // Optional: Toast if empty
              if (filteredComments.length === 0) {
                MessageToast.show("No user comments available.");
              }
        
            } else {
              console.warn("⚠️ commentLink is not an array:", commentsData);
            }
        
          } catch (err) {
            console.error("❌ Failed to parse commentLink JSON:", err);
          }
        }, 300); // Delay in ms to ensure UI is ready (adjust as needed)
        
      },

      onOpenPressed: function (oEvent) {
        debugger
        const oItemContext = oEvent.getSource().getBindingContext("myFile");
        const oFileData = oItemContext.getObject();

        if (!oFileData || !oFileData.content) {
          sap.m.MessageToast.show("File content is missing.");
          return;
        }

        try {
          const byteCharacters = atob(oFileData.content);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }

          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: oFileData.mediaType });

          const url = URL.createObjectURL(blob);
          window.open(url, "_blank");
        } catch (e) {
          console.error("❌ File preview failed:", e);
          sap.m.MessageToast.show("Error opening file.");
        }
      },
      onBrowseHistoryPress: function () {
        debugger
        this.byId("commentHistoryDialog").open();

        debugger
      },
      onCloseHistoryDialog: function () {
        debugger
        this.byId("commentHistoryDialog").close();
      },
      _PostComment: function () {
        // Implement your logic here or call a backend method
      }





    })

  }
);
