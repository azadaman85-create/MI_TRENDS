<?php
/**
 * Filter token bar — components/ui/filter-token-bar.tsx, same classes and look.
 *
 * Each active filter is a token: field | operator | value | ×. Tokens are
 * rendered on the server from the URL; assets/js/filter-bar.js adds the
 * popovers (pick a field, an operator, values) and rewrites the URL, which
 * reloads the shop with the new query — the "×" links work without JavaScript.
 *
 * Args: state (from mi_core_shop_state()).
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

$mi_state  = $args['state'];
$mi_fields = array();
foreach ( $mi_state['fields'] as $mi_field ) {
	$mi_fields[ $mi_field['id'] ] = $mi_field;
}

/**
 * Text for a token's value segment, as summarize() in the original: one label,
 * or "first +N", or a placeholder.
 *
 * @param array $field  Field definition.
 * @param array $values Selected values.
 * @return array{text:string,empty:bool,glyphs:array}
 */
$mi_summary = static function ( $field, $values ) {
	if ( ! $values ) {
		return array( 'text' => __( 'Select…', 'mi-trends' ), 'empty' => true, 'glyphs' => array() );
	}
	$labels = array();
	$glyphs = array();
	foreach ( $field['options'] as $option ) {
		if ( in_array( $option['value'], $values, true ) ) {
			$labels[] = $option['label'];
			if ( ! empty( $option['palette'] ) ) {
				$glyphs[] = $option['palette'];
			}
		}
	}
	$text = count( $labels ) > 1 ? $labels[0] . ' +' . ( count( $labels ) - 1 ) : ( $labels ? $labels[0] : implode( ', ', $values ) );
	return array( 'text' => $text, 'empty' => false, 'glyphs' => array_slice( $glyphs, 0, 3 ) );
};
?>
<div class="fb-bar" role="toolbar" aria-label="<?php esc_attr_e( 'Product filters', 'mi-trends' ); ?>" data-mi-filter-bar>
	<?php foreach ( $mi_state['filters'] as $mi_index => $mi_filter ) : ?>
		<?php
		if ( ! isset( $mi_fields[ $mi_filter['field'] ] ) ) {
			continue;
		}
		$mi_field    = $mi_fields[ $mi_filter['field'] ];
		$mi_operator = $mi_filter['operator'];
		$mi_op_label = $mi_operator;
		foreach ( $mi_field['operators'] as $mi_op ) {
			if ( $mi_op['value'] === $mi_operator ) {
				$mi_op_label = $mi_op['label'];
			}
		}
		$mi_sum = $mi_summary( $mi_field, $mi_filter['values'] );
		?>
		<div class="fb-token" data-mi-token="<?php echo (int) $mi_index; ?>">
			<button type="button" class="fb-seg fb-seg--field" data-mi-seg="field" aria-label="<?php echo esc_attr( sprintf( /* translators: %s: field */ __( 'Field: %s. Edit field.', 'mi-trends' ), $mi_field['label'] ) ); ?>">
				<span class="fb-seg__icon" aria-hidden="true"><?php mi_trends_icon( $mi_field['icon'], array( 'size' => 13 ) ); ?></span>
				<?php echo esc_html( $mi_field['label'] ); ?>
			</button>
			<span aria-hidden="true" class="fb-divider"></span>
			<button type="button" class="fb-seg fb-seg--muted" data-mi-seg="operator" aria-label="<?php echo esc_attr( sprintf( /* translators: %s: operator */ __( 'Operator: %s. Edit operator.', 'mi-trends' ), $mi_op_label ) ); ?>">
				<?php echo esc_html( $mi_op_label ); ?>
			</button>
			<span aria-hidden="true" class="fb-divider"></span>
			<button type="button" class="fb-seg<?php echo $mi_sum['empty'] ? ' fb-seg--muted' : ''; ?>" data-mi-seg="value" aria-label="<?php echo esc_attr( sprintf( /* translators: %s: value */ __( 'Value: %s. Edit value.', 'mi-trends' ), $mi_sum['empty'] ? __( 'none selected', 'mi-trends' ) : $mi_sum['text'] ) ); ?>">
				<?php if ( $mi_sum['glyphs'] ) : ?>
					<span class="fb-seg__glyphs" aria-hidden="true">
						<?php foreach ( $mi_sum['glyphs'] as $mi_palette ) : ?>
							<span style="display:inline-flex;gap:2px">
								<?php foreach ( array_slice( $mi_palette, 0, 3 ) as $mi_hex ) : ?>
									<span style="width:8px;height:8px;border-radius:50%;background:<?php echo esc_attr( $mi_hex ); ?>;border:1px solid rgb(0 0 0 / 0.15)"></span>
								<?php endforeach; ?>
							</span>
						<?php endforeach; ?>
					</span>
				<?php endif; ?>
				<span class="fb-seg__value">
					<?php if ( $mi_sum['empty'] ) : ?>
						<span class="fb-seg__placeholder"><?php echo esc_html( $mi_sum['text'] ); ?></span>
					<?php else : ?>
						<?php echo esc_html( $mi_sum['text'] ); ?>
					<?php endif; ?>
				</span>
			</button>
			<a class="fb-remove" href="<?php echo esc_url( $mi_filter['remove_url'] ); ?>" data-mi-remove aria-label="<?php echo esc_attr( sprintf( /* translators: %s: field */ __( 'Remove %s filter', 'mi-trends' ), $mi_field['label'] ) ); ?>">
				<svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
			</a>
		</div>
	<?php endforeach; ?>

	<button type="button" class="fb-add" data-mi-add aria-haspopup="listbox" aria-expanded="false">
		<svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 2.5v9M2.5 7h9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
		<?php echo $mi_state['filters'] ? esc_html__( 'Add filter', 'mi-trends' ) : esc_html__( 'Filter this edit', 'mi-trends' ); ?>
	</button>

	<?php if ( $mi_state['filters'] ) : ?>
		<a class="fb-clear" href="<?php echo esc_url( $mi_state['clear_url'] ); ?>"><?php esc_html_e( 'Clear', 'mi-trends' ); ?></a>
	<?php endif; ?>
</div>
<script type="application/json" data-mi-filter-config><?php
echo wp_json_encode(
	array(
		'baseUrl' => mi_trends_shop_url(),
		'keep'    => array_values(
			array_filter(
				$mi_state['params'],
				static function ( $pair ) {
					return in_array( $pair[0], array( 'q', 'sort', 'browse' ), true );
				}
			)
		),
		'fields'  => array_values( $mi_fields ),
		'filters' => array_map(
			static function ( $filter ) {
				return array( 'field' => $filter['field'], 'operator' => $filter['operator'], 'values' => $filter['values'] );
			},
			$mi_state['filters']
		),
		'labels'  => array(
			'search'  => __( 'Search…', 'mi-trends' ),
			'none'    => __( 'No matches', 'mi-trends' ),
			'apply'   => __( 'Apply', 'mi-trends' ),
		),
	),
	JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
);
?></script>
