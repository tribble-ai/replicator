/**
 * Additional ServiceNow widgets for Tribble integration
 */

export const TRIBBLE_AGENT_WIDGET = {
  id: 'tribble_agent_widget',
  name: 'Tribble Agent Dashboard',
  description: 'Monitor and interact with Tribble AI agents',

  template: `
<div class="tribble-agent-widget">
  <div class="tribble-agent-header">
    <h3>{{::data.title}}</h3>
    <button ng-click="c.refreshAgents()" class="btn btn-sm btn-link">
      <i class="fa fa-refresh" ng-class="{'fa-spin': c.isLoading}"></i>
    </button>
  </div>

  <div class="tribble-agent-body">
    <div ng-if="c.agents.length === 0 && !c.isLoading" class="tribble-agent-empty">
      <i class="fa fa-robot fa-3x"></i>
      <p>No agents configured</p>
    </div>

    <div ng-repeat="agent in c.agents" class="tribble-agent-card">
      <div class="tribble-agent-card-header">
        <div class="tribble-agent-info">
          <h4>{{agent.name}}</h4>
          <span class="tribble-agent-id">{{agent.id}}</span>
        </div>
        <span class="tribble-agent-status"
              ng-class="{'status-active': agent.status === 'active', 'status-inactive': agent.status !== 'active'}">
          {{agent.status}}
        </span>
      </div>
      <div class="tribble-agent-card-body">
        <p>{{agent.description}}</p>
        <div class="tribble-agent-actions">
          <button ng-click="c.testAgent(agent.id)" class="btn btn-sm btn-primary">
            Test Agent
          </button>
          <button ng-click="c.viewDetails(agent.id)" class="btn btn-sm btn-secondary">
            View Details
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
  `,

  clientScript: `
function TribbleAgentWidget() {
  var c = this;

  c.agents = [];
  c.isLoading = false;

  c.$onInit = function() {
    c.loadAgents();
  };

  c.loadAgents = function() {
    c.isLoading = true;
    c.server.get().then(function(response) {
      c.isLoading = false;
      if (response.data && response.data.agents) {
        c.agents = response.data.agents;
      }
    }, function(error) {
      c.isLoading = false;
      console.error('Error loading agents:', error);
    });
  };

  c.refreshAgents = function() {
    c.loadAgents();
  };

  c.testAgent = function(agentId) {
    c.server.get({
      action: 'test',
      agentId: agentId
    }).then(function(response) {
      if (response.data && response.data.success) {
        alert('Agent test successful!');
      } else {
        alert('Agent test failed: ' + response.data.error);
      }
    });
  };

  c.viewDetails = function(agentId) {
    window.location.href = '?id=tribble_agent_details&agentId=' + agentId;
  };
}
  `,

  serverScript: `
(function() {
  var tribbleClient = new TribbleAPIClient();

  if (input && input.action === 'test' && input.agentId) {
    var result = tribbleClient.getAgentStatus(input.agentId);
    data.success = result.success;
    data.error = result.error;
    return;
  }

  // Load configured agents
  data.agents = [
    {
      id: gs.getProperty('x_tribble.tribble.default_agent_id'),
      name: 'Default Agent',
      description: 'Primary Tribble AI agent',
      status: 'active'
    }
  ];
})();
  `,

  css: `
.tribble-agent-widget {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.tribble-agent-header {
  padding: 20px;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tribble-agent-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.tribble-agent-body {
  padding: 20px;
}

.tribble-agent-empty {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

.tribble-agent-empty i {
  margin-bottom: 20px;
}

.tribble-agent-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 15px;
  overflow: hidden;
}

.tribble-agent-card-header {
  background: #f8f9fa;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tribble-agent-info h4 {
  margin: 0 0 5px 0;
  font-size: 16px;
}

.tribble-agent-id {
  font-size: 12px;
  color: #6c757d;
}

.tribble-agent-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.tribble-agent-status.status-active {
  background: #d4edda;
  color: #155724;
}

.tribble-agent-status.status-inactive {
  background: #f8d7da;
  color: #721c24;
}

.tribble-agent-card-body {
  padding: 15px;
}

.tribble-agent-card-body p {
  margin: 0 0 15px 0;
  color: #495057;
}

.tribble-agent-actions {
  display: flex;
  gap: 10px;
}
  `,

  optionSchema: [
    {
      name: 'title',
      label: 'Widget Title',
      type: 'string',
      defaultValue: 'AI Agents',
    },
  ],
};

export const TRIBBLE_KNOWLEDGE_WIDGET = {
  id: 'tribble_knowledge_widget',
  name: 'Tribble Knowledge Search',
  description: 'AI-powered knowledge article search',

  template: `
<div class="tribble-knowledge-widget">
  <div class="tribble-knowledge-search">
    <div class="search-input-group">
      <i class="fa fa-search"></i>
      <input type="text"
             ng-model="c.searchQuery"
             ng-keypress="c.handleKeyPress($event)"
             placeholder="Search knowledge base..."
             class="form-control">
      <button ng-click="c.search()" class="btn btn-primary" ng-disabled="!c.searchQuery">
        Search
      </button>
    </div>
  </div>

  <div ng-show="c.isSearching" class="tribble-knowledge-loading">
    <i class="fa fa-spinner fa-spin fa-2x"></i>
    <p>Searching knowledge base...</p>
  </div>

  <div ng-show="c.results.length > 0" class="tribble-knowledge-results">
    <h4>Search Results ({{c.results.length}})</h4>
    <div ng-repeat="result in c.results" class="tribble-knowledge-result">
      <div class="result-header">
        <h5>
          <a href="{{result.url}}" target="_blank">{{result.title}}</a>
        </h5>
        <span class="result-score">{{result.score}}% match</span>
      </div>
      <p class="result-excerpt">{{result.excerpt}}</p>
      <div class="result-meta">
        <span><i class="fa fa-folder"></i> {{result.category}}</span>
        <span><i class="fa fa-clock-o"></i> {{result.updated | date:'short'}}</span>
      </div>
    </div>
  </div>

  <div ng-show="c.noResults && !c.isSearching" class="tribble-knowledge-empty">
    <i class="fa fa-search fa-2x"></i>
    <p>No results found for "{{c.lastQuery}}"</p>
  </div>
</div>
  `,

  clientScript: `
function TribbleKnowledgeWidget() {
  var c = this;

  c.searchQuery = '';
  c.lastQuery = '';
  c.results = [];
  c.isSearching = false;
  c.noResults = false;

  c.search = function() {
    if (!c.searchQuery.trim()) return;

    c.lastQuery = c.searchQuery;
    c.isSearching = true;
    c.noResults = false;
    c.results = [];

    c.server.get({
      query: c.searchQuery
    }).then(function(response) {
      c.isSearching = false;
      if (response.data && response.data.results) {
        c.results = response.data.results;
        c.noResults = c.results.length === 0;
      } else {
        c.noResults = true;
      }
    }, function(error) {
      c.isSearching = false;
      c.noResults = true;
    });
  };

  c.handleKeyPress = function(event) {
    if (event.keyCode === 13) {
      c.search();
    }
  };
}
  `,

  serverScript: `
(function() {
  var agentService = new TribbleAgentService();

  var query = input.query;
  if (!query) {
    data.results = [];
    return;
  }

  var agentId = gs.getProperty('x_tribble.tribble.default_agent_id');
  var result = agentService.suggestKnowledge(query, agentId);

  if (result.success && result.data && result.data.articles) {
    data.results = result.data.articles.map(function(article) {
      return {
        title: article.title,
        excerpt: article.excerpt,
        url: article.url,
        score: article.score || 85,
        category: article.category || 'General',
        updated: article.updated || new GlideDateTime().toString()
      };
    });
  } else {
    data.results = [];
  }
})();
  `,

  css: `
.tribble-knowledge-widget {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 20px;
}

.tribble-knowledge-search {
  margin-bottom: 20px;
}

.search-input-group {
  display: flex;
  align-items: center;
  border: 2px solid #ddd;
  border-radius: 24px;
  padding: 8px 16px;
  gap: 10px;
}

.search-input-group:focus-within {
  border-color: #667eea;
}

.search-input-group i {
  color: #6c757d;
}

.search-input-group input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 15px;
}

.search-input-group button {
  border-radius: 20px;
  padding: 8px 20px;
}

.tribble-knowledge-loading,
.tribble-knowledge-empty {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

.tribble-knowledge-results h4 {
  font-size: 18px;
  margin-bottom: 20px;
  color: #495057;
}

.tribble-knowledge-result {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  transition: box-shadow 0.2s;
}

.tribble-knowledge-result:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 10px;
}

.result-header h5 {
  margin: 0;
  font-size: 16px;
}

.result-header h5 a {
  color: #667eea;
  text-decoration: none;
}

.result-header h5 a:hover {
  text-decoration: underline;
}

.result-score {
  background: #d4edda;
  color: #155724;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.result-excerpt {
  color: #495057;
  margin: 10px 0;
  line-height: 1.6;
}

.result-meta {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #6c757d;
}

.result-meta i {
  margin-right: 5px;
}
  `,

  optionSchema: [
    {
      name: 'placeholder',
      label: 'Search Placeholder',
      type: 'string',
      defaultValue: 'Search knowledge base...',
    },
  ],
};
