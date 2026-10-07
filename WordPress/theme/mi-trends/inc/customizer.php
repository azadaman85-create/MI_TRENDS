<?php
/**
 * Homepage content, editable in Appearance → Customize → MI TRENDS homepage.
 *
 * Defaults are the exact copy, links, palettes and images from
 * app/(store)/page.tsx, so a fresh install looks like the Next.js site
 * before anyone touches the Customizer.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

/**
 * Default hero slides (heroSlides in page.tsx).
 *
 * @return array<int,array<string,mixed>>
 */
function mi_trends_default_hero_slides() {
	return array(
		array(
			'kicker'  => 'EVERYDAY ICONS',
			'title'   => "THE TEE YOU\nREACH FOR FIRST.",
			'copy'    => 'Combed cotton, honest cuts and colours that survive the wash pile. Built for every day.',
			'cta'     => "Shop men's tees",
			'href'    => mi_trends_shop_url( array( 'category' => 'men', 'type' => 't-shirt' ) ),
			'palette' => array( '#ff4d28', '#ffcf3f', '#1c1817' ),
			'word'    => '01',
			'image'   => mi_trends_image( 'products/tee-01-a.jpg' ),
		),
		array(
			'kicker'  => 'SOFT NIGHTS',
			'title'   => "SLEEPWEAR WORTH\nSTAYING IN FOR.",
			'copy'    => 'Brushed flannel, cotton check and washed satin — pyjama sets cut loose and finished properly.',
			'cta'     => 'Shop pyjama sets',
			'href'    => mi_trends_shop_url( array( 'category' => 'women' ) ),
			'palette' => array( '#f0c5cd', '#8a4a5c', '#fdf6f3' ),
			'word'    => 'PJ',
			'image'   => mi_trends_image( 'products/pj-01-a.jpg' ),
		),
		array(
			'kicker'  => 'THE SHIRT EDIT',
			'title'   => "SHARP WITHOUT\nTHE STIFFNESS.",
			'copy'    => 'Poplin and fine stripes that work at a desk, a dinner or anywhere in between.',
			'cta'     => 'Shop shirts',
			'href'    => mi_trends_shop_url( array( 'type' => 'shirt' ) ),
			'palette' => array( '#b8d7ff', '#123f8e', '#f8f5ec' ),
			'word'    => 'SH',
			'image'   => mi_trends_image( 'products/shirt-01-a.jpg' ),
		),
	);
}

/**
 * Hero slides with Customizer overrides applied.
 *
 * @return array<int,array<string,mixed>>
 */
function mi_trends_hero_slides() {
	$slides = mi_trends_default_hero_slides();
	foreach ( $slides as $i => &$slide ) {
		$n = $i + 1;
		foreach ( array( 'kicker', 'title', 'copy', 'cta', 'href', 'word' ) as $field ) {
			$value = get_theme_mod( "mi_hero_{$n}_{$field}", '' );
			if ( '' !== $value ) {
				$slide[ $field ] = $value;
			}
		}
		$image_id = (int) get_theme_mod( "mi_hero_{$n}_image", 0 );
		if ( $image_id ) {
			$url = wp_get_attachment_image_url( $image_id, 'large' );
			if ( $url ) {
				$slide['image'] = $url;
			}
		}
		foreach ( array( 0, 1, 2 ) as $p ) {
			$hex = get_theme_mod( "mi_hero_{$n}_palette_{$p}", '' );
			if ( $hex ) {
				$slide['palette'][ $p ] = $hex;
			}
		}
	}
	return apply_filters( 'mi_trends_hero_slides', $slides );
}

/**
 * Category bubbles / mobile stories (homeCategories in page.tsx).
 *
 * @return array<int,array<string,string>>
 */
function mi_trends_home_categories() {
	return apply_filters(
		'mi_trends_home_categories',
		array(
			array( 'label' => 'T-shirts', 'symbol' => 'TEE', 'href' => mi_trends_shop_url( array( 'type' => 't-shirt' ) ), 'tone' => 'blue', 'image' => mi_trends_image( 'products/tee-03-a.jpg' ) ),
			array( 'label' => 'Shirts', 'symbol' => 'SHT', 'href' => mi_trends_shop_url( array( 'type' => 'shirt' ) ), 'tone' => 'lime', 'image' => mi_trends_image( 'products/shirt-02-a.jpg' ) ),
			array( 'label' => 'Pyjama sets', 'symbol' => 'PJS', 'href' => mi_trends_shop_url( array( 'type' => 'pyjama-set' ) ), 'tone' => 'pink', 'image' => mi_trends_image( 'products/pj-05-a.jpg' ) ),
			array( 'label' => 'Men', 'symbol' => 'MEN', 'href' => mi_trends_shop_url( array( 'category' => 'men' ) ), 'tone' => 'peach', 'image' => mi_trends_image( 'products/tee-01-a.jpg' ) ),
			array( 'label' => 'Women', 'symbol' => 'WMN', 'href' => mi_trends_shop_url( array( 'category' => 'women' ) ), 'tone' => 'lilac', 'image' => mi_trends_image( 'products/pj-03-a.jpg' ) ),
			array( 'label' => 'On sale', 'symbol' => 'SLE', 'href' => mi_trends_shop_url( array( 'tag' => 'sale' ) ), 'tone' => 'red', 'image' => mi_trends_image( 'products/pj-01-a.jpg' ) ),
		)
	);
}

/**
 * Editorial cards (editorials in page.tsx).
 *
 * @return array<int,array<string,string>>
 */
function mi_trends_home_editorials() {
	return apply_filters(
		'mi_trends_home_editorials',
		array(
			array( 'overline' => 'Everyday Icons', 'title' => 'TEES, SORTED', 'copy' => 'Combed cotton in the three colours you actually wear.', 'href' => mi_trends_shop_url( array( 'type' => 't-shirt' ) ), 'class' => 'editorial-card--orange', 'art' => 'TEE', 'image' => mi_trends_image( 'products/tee-02-a.jpg' ) ),
			array( 'overline' => 'Everyday Icons', 'title' => 'SHIRT SEASON', 'copy' => 'Poplin and fine stripes, sharp without the stiffness.', 'href' => mi_trends_shop_url( array( 'type' => 'shirt' ) ), 'class' => 'editorial-card--blue', 'art' => 'SHT', 'image' => mi_trends_image( 'products/shirt-02-a.jpg' ) ),
			array( 'overline' => 'Soft Nights', 'title' => 'STAY IN CLUB', 'copy' => 'Flannel, check and satin sets for very serious lounging.', 'href' => mi_trends_shop_url( array( 'type' => 'pyjama-set' ) ), 'class' => 'editorial-card--green', 'art' => 'PJS', 'image' => mi_trends_image( 'products/pj-02-a.jpg' ) ),
		)
	);
}

/**
 * "Shop the edits" tiles (collectionTiles in page.tsx).
 *
 * @return array<int,array<string,string>>
 */
function mi_trends_home_collection_tiles() {
	return apply_filters(
		'mi_trends_home_collection_tiles',
		array(
			array( 'title' => 'Everyday Icons', 'copy' => 'Tees and shirts, sorted.', 'href' => mi_trends_shop_url( array( 'collection' => 'everyday-icons' ) ), 'tone' => 'collection-tile--ink' ),
			array( 'title' => 'Soft Nights', 'copy' => 'Pyjama sets for slow mornings.', 'href' => mi_trends_shop_url( array( 'collection' => 'soft-nights' ) ), 'tone' => 'collection-tile--pink' ),
			array( 'title' => "The Men's Edit", 'copy' => "Every men's piece in one place.", 'href' => mi_trends_shop_url( array( 'category' => 'men' ) ), 'tone' => 'collection-tile--blue' ),
			array( 'title' => "The Women's Edit", 'copy' => "Every women's piece in one place.", 'href' => mi_trends_shop_url( array( 'category' => 'women' ) ), 'tone' => 'collection-tile--lime' ),
		)
	);
}

add_action( 'customize_register', 'mi_trends_customize_register' );
/**
 * Customizer section for the three hero slides.
 *
 * @param WP_Customize_Manager $wp_customize Manager.
 */
function mi_trends_customize_register( $wp_customize ) {
	$wp_customize->add_panel(
		'mi_trends_home',
		array(
			'title'       => __( 'MI TRENDS homepage', 'mi-trends' ),
			'description' => __( 'Hero carousel slides. Leave a field empty to keep the original copy.', 'mi-trends' ),
			'priority'    => 30,
		)
	);

	$defaults = mi_trends_default_hero_slides();

	foreach ( $defaults as $i => $slide ) {
		$n       = $i + 1;
		$section = "mi_hero_{$n}";
		$wp_customize->add_section(
			$section,
			array(
				/* translators: %d: slide number */
				'title' => sprintf( __( 'Hero slide %d', 'mi-trends' ), $n ),
				'panel' => 'mi_trends_home',
			)
		);

		$text_fields = array(
			'kicker' => array( __( 'Kicker', 'mi-trends' ), 'text', 'sanitize_text_field' ),
			'title'  => array( __( 'Headline (new line = line break)', 'mi-trends' ), 'textarea', 'sanitize_textarea_field' ),
			'copy'   => array( __( 'Body copy', 'mi-trends' ), 'textarea', 'sanitize_textarea_field' ),
			'cta'    => array( __( 'Button label', 'mi-trends' ), 'text', 'sanitize_text_field' ),
			'href'   => array( __( 'Button link', 'mi-trends' ), 'url', 'esc_url_raw' ),
			'word'   => array( __( 'Badge text (e.g. 01)', 'mi-trends' ), 'text', 'sanitize_text_field' ),
		);

		foreach ( $text_fields as $field => $config ) {
			$wp_customize->add_setting( "mi_hero_{$n}_{$field}", array( 'default' => '', 'sanitize_callback' => $config[2] ) );
			$wp_customize->add_control(
				"mi_hero_{$n}_{$field}",
				array(
					'label'       => $config[0],
					'section'     => $section,
					'type'        => $config[1],
					'input_attrs' => array( 'placeholder' => is_string( $slide[ $field ] ) ? $slide[ $field ] : '' ),
				)
			);
		}

		$wp_customize->add_setting( "mi_hero_{$n}_image", array( 'default' => 0, 'sanitize_callback' => 'absint' ) );
		$wp_customize->add_control(
			new WP_Customize_Media_Control(
				$wp_customize,
				"mi_hero_{$n}_image",
				array(
					'label'     => __( 'Image (3:4 portrait works best)', 'mi-trends' ),
					'section'   => $section,
					'mime_type' => 'image',
				)
			)
		);

		$palette_labels = array( __( 'Main colour', 'mi-trends' ), __( 'Accent colour', 'mi-trends' ), __( 'Ink colour', 'mi-trends' ) );
		foreach ( array( 0, 1, 2 ) as $p ) {
			$wp_customize->add_setting( "mi_hero_{$n}_palette_{$p}", array( 'default' => $slide['palette'][ $p ], 'sanitize_callback' => 'sanitize_hex_color' ) );
			$wp_customize->add_control(
				new WP_Customize_Color_Control(
					$wp_customize,
					"mi_hero_{$n}_palette_{$p}",
					array(
						'label'   => $palette_labels[ $p ],
						'section' => $section,
					)
				)
			);
		}
	}
}
