import React from 'react';
import { Text, View } from 'react-native';
import { ListItem } from 'react-native-elements';
import Storage from '../../extend/storage';

import { AlarmList } from '../alarmList';

import { color, style } from '../../styles';

export default class AlarmItem extends React.PureComponent {
	
	props: {
		k: string,
		list?: AlarmList,
		onPress?: ( AlarmItem ) => void
	};
	
	state = {
		type:   '',
		label:  '',
		time:   '',
		repeat: [],
		active: false
	};
	
	key: string;
	mounted = false;
	
	constructor( props ) {
		super( props );
		this.key = props.k;
	}
	
	componentDidMount(): void {
		this.mounted = true;
		this.load().then();
	}
	
	componentWillUnmount(): void {
		this.mounted = false;
	}
	
	public static async create( key, label, time, repeat ): Promise<AlarmItem> {
		if ( !key )
			key = Math.random().toString( 36 ).substring( 2, 12 );
		
		let data = { type: 'Alarm', label, time, repeat, active: false };
		await Storage.setItem( key, data );
		return new AlarmItem( { k: key } );
	}
	
	public async load(): Promise<this> {
		await Storage.getItem( this.key ).then( data => {
			if ( data ) {
				if ( this.mounted )
					this.setState( data );
				else
					this.state = data;
			}
		} );
		return this;
	}
	
	/**
	 * Saves data.
	 * TODO: turn on notifications here
	 * @returns {Promise<void>}
	 */
	public async save(): Promise<void> {
		await Storage.mergeItem( this.key,
			{
				label:  this.state.label,
				time:   this.state.time,
				repeat: this.state.repeat,
				active: this.state.active
			} );
	}
	
	public async delete(): Promise<void> {
		await Storage.removeItem( this.key );
	}
	
	public async activate( active: boolean ): Promise<void> {
		this.state.active = active;
		await this.save();
	}
	
	render(): JSX.Element {
		if ( !this.state.type.length )
			return null;
		
		return <ListItem
			containerStyle={[ color.listItem ]}
			topDivider
			bottomDivider
			title={this.state.label}
			titleStyle={[ color.foreground, { fontSize: 36 } ]}
			subtitle={this.subtitle()}
			onPress={this.onPress}
			switch={{
				value:         this.state.active,
				onValueChange: ( active ) => {
					this.setState( { active }, () => {
						this.save().then( () =>
							this.props.list.state.group.reloadActive(
								this.props.list.props.navigation.getParam( 'parent', null )
							).then()
						);
					} );
				}
			}}
		/>
	}
	
	subtitle = () => {
		const days = 'SMTWTFS';
		let repeat = [];
		for ( let i = 0; i < 7; ++i ) {
			repeat[ i ] = <Text key={i} style={[
				this.state.repeat[ i ] ? color.highlight : color.foreground
			]}> {days[ i ]}</Text>;
		}
		
		return <View style={[ style.flex, style.row, style.space ]}>
			<Text style={[ color.foreground, {
				fontSize: 16
			} ]}>{AlarmItem.timeTo12Hour( this.state.time )}</Text>
			<Text style={{ fontSize: 16 }}>{repeat}</Text>
		</View>;
	};
	
	onPress = () => this.props.onPress( this );
	
	public static dateToTime( date: Date ): string {
		return `${date.getHours()}:${( `0${date.getMinutes()}` ).slice( -2 )}`;
	}
	
	public static timeTo12Hour( time: string ): string {
		let parts = time.split( ':' );
		let hour = parseInt( parts[ 0 ] );
		return `${( hour + 11 ) % 12 + 1}:${parts[ 1 ]} ${( hour >= 12 ? 'PM' : 'AM' )}`;
	}
	
	public static fillArray( array: Array<number> ): Array<boolean> {
		let res = [];
		for ( let i = 0; i < 7; ++i )
			res[ i ] = array.includes( i );
		return res;
	}
	
	public static emptyArray( array: Array<boolean> ): Array<number> {
		let res = [];
		for ( let i = 0; i < 7; ++i )
			if ( array[ i ] )
				res.push( i );
		return res;
	}
	
}
