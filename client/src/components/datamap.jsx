import PropTypes from 'prop-types';
import React from 'react';
import Datamaps from 'datamaps';
import axios from 'axios';

const MAP_CLEARING_PROPS = [
  'height', 'scope', 'setProjection', 'width'
];

const propChangeRequiresMapClear = (oldProps, newProps) => {
  return MAP_CLEARING_PROPS.some((key) =>
		oldProps[key] !== newProps[key]
  );
};

export default class Datamap extends React.Component {
	
  constructor(props) {
		super(props);
		this.resizeMap = this.resizeMap.bind(this);
  }

  componentDidMount() {
		if (this.props.responsive) {
			window.addEventListener('resize', this.resizeMap);
		}
		this.drawMap();
  }

  componentWillReceiveProps(newProps) {
		if (propChangeRequiresMapClear(this.props, newProps)) {
			this.clear();
		}
  }

  componentDidUpdate() {
		this.drawMap();
  }

  componentWillUnmount() {
		this.clear();
		if (this.props.responsive) {
			window.removeEventListener('resize', this.resizeMap);
		}
  }

  clear() {
		const { container } = this.refs;

		for (const child of Array.from(container.childNodes)) {
			container.removeChild(child);
		}

		delete this.map;
	}

  drawMap() {
		const {
			arc,
			arcOptions,
			bubbles,
			bubbleOptions,
			data,
			graticule,
			labels,
			updateChoroplethOptions,
		} = this.props;

		let map = this.map;

		if (!map) {
			map = this.map = new Datamaps({
				scope: this.props.scope,
				labels: this.props.labels,
				fills: this.props.fills,
				element: this.refs.container,
			 	geographyConfig: this.props.geographyConfig,
				data,
			});
		} else {
				map.options.fills = this.props.fills;
        map.updateChoropleth(data, updateChoroplethOptions);
			}
      //map.legend();
			if (arc) {
				map.arc(arc, arcOptions);
			}

			if (bubbles) {
		  
			}

			if (graticule) {
			  map.graticule();
			}

			if (labels) {
			  map.labels();
			}
	}
	
	resizeMap() {
	  this.map.resize();
	}

	render() {
	  const style = {
			height: this.props.height,
			width: this.props.width,
			position: this.props.position,
	  };
	  return <div ref="container" style={style} />;
	}

}
