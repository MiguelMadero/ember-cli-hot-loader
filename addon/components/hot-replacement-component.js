import Ember from 'ember';
import HotComponentMixin from 'ember-cli-hot-loader/mixins/hot-component';
import clearCache from 'ember-cli-hot-loader/utils/clear-container-cache';
import layout from '../templates/components/hot-replacement-component';

export function matchesPodConvention (componentName, modulePath) {
  var filePathArray = modulePath.split('/');
  var type = filePathArray[filePathArray.length - 3];
  var componentNameFromPath = filePathArray[filePathArray.length - 2];
  var fileName = filePathArray[filePathArray.length - 1];
  return type === 'components' && componentName === componentNameFromPath && (fileName === 'component.js' || fileName === 'template.hbs');
}
export function matchesClassicConvention (componentName, modulePath) {
  var filePathArray = modulePath.split('/');
  var type = filePathArray[filePathArray.length - 2];
  var componentNameFromPath = filePathArray[filePathArray.length - 1].replace(/.js$|.hbs$/, '');
  return type === 'components' && componentName === componentNameFromPath;
}
function matchingComponent (componentName, modulePath) {
  if(!componentName) {
      return false;
  }
  // For now we only support standard conventions, later we may have a better
  // way to learn from resolver resolutions
  return matchesClassicConvention(componentName, modulePath) ||
    matchesPodConvention(componentName, modulePath);
}

const HotReplacementComponent = Ember.Component.extend(HotComponentMixin, {
  baseComponentName: null,
  tagName: '',
  layout,

  __willLiveReload (event) {
    if (matchingComponent(this.get('baseComponentName'), event.modulePath)) {
      event.cancel = true;
    }
  },
  __rerenderOnTemplateUpdate (modulePath) {
      const baseComponentName = this.get('baseComponentName');
      if(matchingComponent(baseComponentName, modulePath)) {
          this._super(...arguments);
          clearCache(this, baseComponentName);
          this.setProperties({
            baseComponentName: undefined
          });
          this.rerender();
          Ember.run.later(()=> {
            this.setProperties({
              baseComponentName: baseComponentName
            });
          });
      }
  }
});

export default HotReplacementComponent;
