/**
 * SAPUI5/Fiori Application Generation
 *
 * Tools for scaffolding and building Fiori applications integrated with Tribble.
 */

import type { FioriManifest, FioriAppType } from '../types';

/**
 * Generate manifest.json for Fiori application
 */
export function generateManifest(config: {
  appId: string;
  appName: string;
  description: string;
  version: string;
  namespace: string;
  odataService?: string;
  appType?: FioriAppType;
}): FioriManifest {
  return {
    '_version': '1.59.0' as any,
    'sap.app': {
      id: config.appId,
      type: 'application',
      i18n: 'i18n/i18n.properties',
      applicationVersion: {
        version: config.version,
      },
      title: config.appName,
      description: config.description,
      dataSources: config.odataService
        ? {
            mainService: {
              uri: config.odataService,
              type: 'OData',
              settings: {
                odataVersion: '2.0',
                localUri: 'localService/metadata.xml',
              },
            },
          }
        : undefined,
      crossNavigation: {
        inbounds: {
          intent1: {
            semanticObject: 'tribble',
            action: 'display',
            title: config.appName,
            signature: {
              parameters: {},
              additionalParameters: 'allowed',
            },
          },
        },
      },
    },
    'sap.ui5': {
      rootView: {
        viewName: `${config.namespace}.view.App`,
        type: 'XML',
        id: 'app',
      },
      dependencies: {
        minUI5Version: '1.120.0',
        libs: {
          'sap.ui.core': {},
          'sap.m': {},
          'sap.ui.layout': {},
        },
      },
      models: {
        i18n: {
          type: 'sap.ui.model.resource.ResourceModel',
          settings: {
            bundleName: `${config.namespace}.i18n.i18n`,
          },
        },
        ...(config.odataService
          ? {
              '': {
                dataSource: 'mainService',
                preload: true,
                settings: {
                  defaultBindingMode: 'TwoWay',
                  defaultCountMode: 'Inline',
                  refreshAfterChange: false,
                  metadataUrlParams: {
                    'sap-value-list': 'none',
                  },
                },
              },
            }
          : {}),
      },
      routing: {
        config: {
          routerClass: 'sap.m.routing.Router',
          viewType: 'XML',
          viewPath: `${config.namespace}.view`,
          controlId: 'app',
          controlAggregation: 'pages',
          async: true,
        },
        routes: [
          {
            pattern: '',
            name: 'main',
            target: 'main',
          },
        ],
        targets: {
          main: {
            viewType: 'XML',
            viewName: 'Main',
            viewId: 'main',
          },
        },
      },
    },
    'sap.fiori': {
      registrationIds: ['F1234'],
      archeType: config.appType || 'freestyle',
    },
  };
}

/**
 * Generate Component.js
 */
export function generateComponent(namespace: string): string {
  return `sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/model/json/JSONModel",
  "sap/ui/Device"
], function (UIComponent, JSONModel, Device) {
  "use strict";

  return UIComponent.extend("${namespace}.Component", {
    metadata: {
      manifest: "json"
    },

    /**
     * The component is initialized by UI5 automatically during the startup of the app
     * @public
     * @override
     */
    init: function () {
      // call the base component's init function
      UIComponent.prototype.init.apply(this, arguments);

      // set device model
      var oDeviceModel = new JSONModel(Device);
      oDeviceModel.setDefaultBindingMode("OneWay");
      this.setModel(oDeviceModel, "device");

      // initialize Tribble SDK
      this._initializeTribble();

      // create the views based on the url/hash
      this.getRouter().initialize();
    },

    /**
     * Initialize Tribble SDK
     * @private
     */
    _initializeTribble: function () {
      // Load Tribble configuration from backend
      var oTribbleModel = new JSONModel({
        apiUrl: "/tribble/api",
        agentId: "",
        conversationId: null,
        messages: [],
        loading: false
      });
      this.setModel(oTribbleModel, "tribble");
    }
  });
});`;
}

/**
 * Generate index.html
 */
export function generateIndexHTML(config: {
  appId: string;
  title: string;
  theme?: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title}</title>
    <script
        id="sap-ui-bootstrap"
        src="https://sdk.openui5.org/resources/sap-ui-core.js"
        data-sap-ui-theme="${config.theme || 'sap_horizon'}"
        data-sap-ui-resourceroots='{
            "${config.appId}": "./"
        }'
        data-sap-ui-oninit="module:sap/ui/core/ComponentSupport"
        data-sap-ui-compatVersion="edge"
        data-sap-ui-async="true"
        data-sap-ui-frameOptions="trusted">
    </script>
</head>
<body class="sapUiBody" id="content">
    <div
        data-sap-ui-component
        data-name="${config.appId}"
        data-id="container"
        data-settings='{"id" : "${config.appId}"}'
        data-handle-validation="true">
    </div>
</body>
</html>`;
}

/**
 * Generate App.view.xml
 */
export function generateAppView(namespace: string): string {
  return `<mvc:View
    controllerName="${namespace}.controller.App"
    xmlns:mvc="sap.ui.core.mvc"
    displayBlock="true"
    xmlns="sap.m">
    <Shell id="shell">
        <App id="app" />
    </Shell>
</mvc:View>`;
}

/**
 * Generate App.controller.js
 */
export function generateAppController(namespace: string): string {
  return `sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function (Controller) {
  "use strict";

  return Controller.extend("${namespace}.controller.App", {
    onInit: function () {
      // Apply content density mode
      this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
    }
  });
});`;
}

/**
 * Generate Tribble Chat view
 */
export function generateChatView(namespace: string): string {
  return `<mvc:View
    controllerName="${namespace}.controller.TribbleChat"
    xmlns:mvc="sap.ui.core.mvc"
    xmlns="sap.m"
    xmlns:l="sap.ui.layout"
    xmlns:f="sap.ui.layout.form">
    <Page
        id="chatPage"
        title="{i18n>chatTitle}"
        showNavButton="true"
        navButtonPress=".onNavBack">
        <content>
            <l:VerticalLayout class="sapUiContentPadding" width="100%">
                <!-- Agent Selection -->
                <f:SimpleForm
                    editable="true"
                    layout="ResponsiveGridLayout"
                    labelSpanXL="4"
                    labelSpanL="4"
                    labelSpanM="12"
                    labelSpanS="12"
                    adjustLabelSpan="false"
                    emptySpanXL="0"
                    emptySpanL="0"
                    emptySpanM="0"
                    emptySpanS="0"
                    columnsXL="1"
                    columnsL="1"
                    columnsM="1"
                    singleContainerFullSize="false">
                    <f:content>
                        <Label text="{i18n>agent}" />
                        <Select
                            id="agentSelect"
                            selectedKey="{tribble>/agentId}"
                            items="{tribble>/agents}">
                            <core:Item key="{tribble>id}" text="{tribble>name}" />
                        </Select>
                    </f:content>
                </f:SimpleForm>

                <!-- Chat Messages -->
                <List
                    id="messageList"
                    items="{tribble>/messages}"
                    growing="true"
                    growingScrollToLoad="true"
                    class="sapUiResponsiveMargin">
                    <CustomListItem>
                        <l:VerticalLayout width="100%">
                            <HBox justifyContent="{= \${tribble>role} === 'user' ? 'End' : 'Start' }">
                                <VBox class="sapUiTinyMargin">
                                    <Text
                                        text="{tribble>role}"
                                        class="sapUiTinyMarginBottom" />
                                    <MessageStrip
                                        text="{tribble>content}"
                                        type="{= \${tribble>role} === 'assistant' ? 'Information' : 'None' }"
                                        showIcon="true"
                                        class="sapUiSmallMarginBottom" />
                                    <Text
                                        text="{tribble>timestamp}"
                                        class="sapUiTinyText" />
                                </VBox>
                            </HBox>
                        </l:VerticalLayout>
                    </CustomListItem>
                </List>
            </l:VerticalLayout>
        </content>
        <footer>
            <Toolbar>
                <Input
                    id="messageInput"
                    placeholder="{i18n>messagePlaceholder}"
                    value="{tribble>/currentMessage}"
                    submit=".onSendMessage"
                    width="100%" />
                <Button
                    icon="sap-icon://paper-plane"
                    type="Emphasized"
                    press=".onSendMessage"
                    enabled="{= \${tribble>/currentMessage}.length > 0 &amp;&amp; !\${tribble>/loading} }" />
            </Toolbar>
        </footer>
    </Page>
</mvc:View>`;
}

/**
 * Generate Tribble Chat controller
 */
export function generateChatController(namespace: string): string {
  return `sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
  "use strict";

  return Controller.extend("${namespace}.controller.TribbleChat", {
    onInit: function () {
      // Initialize chat model
      var oChatModel = new JSONModel({
        agentId: "",
        agents: [],
        conversationId: null,
        messages: [],
        currentMessage: "",
        loading: false
      });
      this.getView().setModel(oChatModel, "tribble");

      // Load available agents
      this._loadAgents();
    },

    /**
     * Load available Tribble agents
     * @private
     */
    _loadAgents: function () {
      var oModel = this.getView().getModel("tribble");

      // Call OData service to get agents
      this.getView().getModel().read("/Agents", {
        success: function (oData) {
          oModel.setProperty("/agents", oData.results);
          if (oData.results.length > 0) {
            oModel.setProperty("/agentId", oData.results[0].id);
          }
        },
        error: function (oError) {
          MessageToast.show("Failed to load agents");
        }
      });
    },

    /**
     * Send message to Tribble agent
     */
    onSendMessage: function () {
      var oModel = this.getView().getModel("tribble");
      var sMessage = oModel.getProperty("/currentMessage");
      var sAgentId = oModel.getProperty("/agentId");
      var sConversationId = oModel.getProperty("/conversationId");

      if (!sMessage || !sAgentId) {
        return;
      }

      // Add user message to UI
      var aMessages = oModel.getProperty("/messages");
      aMessages.push({
        role: "user",
        content: sMessage,
        timestamp: new Date().toISOString()
      });
      oModel.setProperty("/messages", aMessages);
      oModel.setProperty("/currentMessage", "");
      oModel.setProperty("/loading", true);

      // Create message via OData
      var oDataModel = this.getView().getModel();
      oDataModel.create("/Messages", {
        conversationId: sConversationId || "",
        agentId: sAgentId,
        role: "user",
        content: sMessage,
        timestamp: new Date()
      }, {
        success: function (oData) {
          // Update conversation ID if new
          if (!sConversationId) {
            oModel.setProperty("/conversationId", oData.conversationId);
          }

          // Poll for agent response
          this._pollForResponse(oData.conversationId);
        }.bind(this),
        error: function (oError) {
          MessageToast.show("Failed to send message");
          oModel.setProperty("/loading", false);
        }.bind(this)
      });
    },

    /**
     * Poll for agent response
     * @private
     */
    _pollForResponse: function (sConversationId) {
      var oModel = this.getView().getModel("tribble");
      var oDataModel = this.getView().getModel();

      // Read messages for conversation
      oDataModel.read("/Messages", {
        filters: [
          new sap.ui.model.Filter("conversationId", "EQ", sConversationId),
          new sap.ui.model.Filter("role", "EQ", "assistant")
        ],
        sorters: [
          new sap.ui.model.Sorter("timestamp", true)
        ],
        success: function (oData) {
          if (oData.results.length > 0) {
            // Get latest assistant message
            var oLatestMessage = oData.results[0];
            var aMessages = oModel.getProperty("/messages");

            // Check if message already exists
            var bExists = aMessages.some(function(msg) {
              return msg.id === oLatestMessage.id;
            });

            if (!bExists) {
              aMessages.push({
                id: oLatestMessage.id,
                role: "assistant",
                content: oLatestMessage.content,
                timestamp: oLatestMessage.timestamp
              });
              oModel.setProperty("/messages", aMessages);
              oModel.setProperty("/loading", false);
            } else {
              // Keep polling
              setTimeout(function() {
                this._pollForResponse(sConversationId);
              }.bind(this), 1000);
            }
          } else {
            // Keep polling
            setTimeout(function() {
              this._pollForResponse(sConversationId);
            }.bind(this), 1000);
          }
        }.bind(this),
        error: function (oError) {
          oModel.setProperty("/loading", false);
        }.bind(this)
      });
    },

    /**
     * Navigate back
     */
    onNavBack: function () {
      this.getOwnerComponent().getRouter().navTo("main");
    }
  });
});`;
}

/**
 * Generate Tribble Document Upload view
 */
export function generateUploadView(namespace: string): string {
  return `<mvc:View
    controllerName="${namespace}.controller.TribbleUpload"
    xmlns:mvc="sap.ui.core.mvc"
    xmlns="sap.m"
    xmlns:u="sap.ui.unified"
    xmlns:l="sap.ui.layout">
    <Page
        id="uploadPage"
        title="{i18n>uploadTitle}"
        showNavButton="true"
        navButtonPress=".onNavBack">
        <content>
            <l:VerticalLayout class="sapUiContentPadding" width="100%">
                <!-- Collection Selection -->
                <Label text="{i18n>collection}" />
                <Select
                    id="collectionSelect"
                    selectedKey="{tribble>/collectionId}"
                    items="{tribble>/collections}">
                    <core:Item key="{tribble>id}" text="{tribble>name}" />
                </Select>

                <!-- File Upload -->
                <u:FileUploader
                    id="fileUploader"
                    name="myFileUpload"
                    uploadUrl="/tribble/upload"
                    tooltip="{i18n>uploadTooltip}"
                    uploadComplete=".onUploadComplete"
                    change=".onFileChange"
                    style="Emphasized"
                    buttonText="{i18n>selectFile}"
                    placeholder="{i18n>chooseFile}"
                    class="sapUiSmallMarginTop" />

                <Button
                    text="{i18n>upload}"
                    type="Emphasized"
                    press=".onUploadPress"
                    enabled="{tribble>/uploadEnabled}"
                    class="sapUiSmallMarginTop" />

                <!-- Upload Progress -->
                <ProgressIndicator
                    id="uploadProgress"
                    percentValue="{tribble>/uploadProgress}"
                    displayValue="{tribble>/uploadStatus}"
                    showValue="true"
                    visible="{tribble>/uploading}"
                    class="sapUiMediumMarginTop" />

                <!-- Document List -->
                <Table
                    id="documentTable"
                    items="{tribble>/documents}"
                    growing="true"
                    growingScrollToLoad="true"
                    class="sapUiResponsiveMarginTop">
                    <headerToolbar>
                        <Toolbar>
                            <Title text="{i18n>documents}" level="H2" />
                            <ToolbarSpacer />
                            <Button
                                icon="sap-icon://refresh"
                                press=".onRefresh" />
                        </Toolbar>
                    </headerToolbar>
                    <columns>
                        <Column><Text text="{i18n>filename}" /></Column>
                        <Column><Text text="{i18n>size}" /></Column>
                        <Column><Text text="{i18n>status}" /></Column>
                        <Column><Text text="{i18n>uploadedAt}" /></Column>
                        <Column><Text text="{i18n>actions}" /></Column>
                    </columns>
                    <items>
                        <ColumnListItem>
                            <cells>
                                <Text text="{tribble>filename}" />
                                <Text text="{tribble>size}" />
                                <ObjectStatus
                                    text="{tribble>status}"
                                    state="{= \${tribble>status} === 'processed' ? 'Success' : 'Warning' }" />
                                <Text text="{tribble>uploadedAt}" />
                                <HBox>
                                    <Button
                                        icon="sap-icon://delete"
                                        type="Transparent"
                                        press=".onDeleteDocument" />
                                </HBox>
                            </cells>
                        </ColumnListItem>
                    </items>
                </Table>
            </l:VerticalLayout>
        </content>
    </Page>
</mvc:View>`;
}

/**
 * Export all UI5 utilities
 */
export * from '../types';
