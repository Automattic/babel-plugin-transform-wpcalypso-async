module.exports = function( babel ) {
	const t = babel.types;

	return {
		visitor: {
			JSXAttribute: function( path ) {
				const parent = path.parentPath.parent;
				if ( 'AsyncLoad' !== parent.openingElement.name.name ) {
					return;
				}

				const name = path.node.name;
				if ( 'JSXIdentifier' !== name.type || 'require' !== name.name ) {
					return;
				}

				const value = path.node.value;
				if ( 'StringLiteral' !== value.type ) {
					return;
				}

				const newValue = t.jSXExpressionContainer(
					t.functionExpression( null, [ t.identifier( 'callback' ) ], t.blockStatement( [
						t.expressionStatement( t.callExpression( t.identifier( 'asyncRequire' ), [
							value,
							t.identifier( 'callback' )
						] ) )
					] ) )
				);

				path.replaceWith( t.jSXAttribute( name, newValue ) );
			},
			CallExpression: function( path, state ) {
				if ( 'asyncRequire' !== path.node.callee.name ) {
					return;
				}

				const argument = path.node.arguments[ 0 ];
				if ( ! argument || 'StringLiteral' !== argument.type ) {
					return;
				}

				const isAsync = state.opts.async;

				let requireCall = t.callExpression( t.identifier( 'require' ), [ argument ] );
				const callback = path.node.arguments[ 1 ];
				if ( callback ) {
					requireCall = t.callExpression( callback, [ requireCall ] );
				}

				if ( isAsync ) {
					path.replaceWith(
						t.callExpression( t.memberExpression( t.identifier( 'require' ), t.identifier( 'ensure' ) ), [
							argument,
							t.functionExpression( null, [ t.identifier( 'require' ) ], t.blockStatement( [
								t.expressionStatement( requireCall )
							] ) ),
							t.stringLiteral( 'async-load-' + argument.value )
						] )
					);
				} else {
					path.replaceWith( requireCall );
				}
			}
		}
	};
};
