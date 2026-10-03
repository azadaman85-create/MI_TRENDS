<?php
/**
 * Customer email for MI TRENDS fulfilment statuses.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * "Your order is packed / shipped / delivered …"
 */
class MI_Core_Email_Status_Update extends WC_Email {

	/**
	 * Status that triggered the current send.
	 *
	 * @var string
	 */
	public $status = '';

	/**
	 * Set up.
	 */
	public function __construct() {
		$this->id             = 'mi_status_update';
		$this->customer_email = true;
		$this->title          = __( 'MI TRENDS order update', 'mi-trends-core' );
		$this->description    = __( 'Sent to the customer when an order moves to Confirmed, Packed, Shipped, Delivered or Returned.', 'mi-trends-core' );
		$this->template_html  = 'emails/mi-status-update.php';
		$this->template_plain = 'emails/plain/mi-status-update.php';
		$this->template_base  = MI_CORE_DIR . 'templates/';
		$this->placeholders   = array(
			'{order_number}' => '',
			'{status}'       => '',
		);

		foreach ( array_keys( MI_Core_Order_Status::statuses() ) as $status ) {
			add_action( 'woocommerce_order_status_' . $status . '_notification', array( $this, 'trigger' ), 10, 2 );
		}

		parent::__construct();
	}

	/**
	 * Default subject.
	 *
	 * @return string
	 */
	public function get_default_subject() {
		return __( 'Your MI TRENDS order {order_number} is {status}', 'mi-trends-core' );
	}

	/**
	 * Default heading.
	 *
	 * @return string
	 */
	public function get_default_heading() {
		return __( 'Order {status}', 'mi-trends-core' );
	}

	/**
	 * Copy shown above the order table, per status.
	 *
	 * @return string
	 */
	public function status_message() {
		$messages = array(
			'confirmed' => __( 'Good news — your order is confirmed and heading to our packing table.', 'mi-trends-core' ),
			'packed'    => __( 'Your order is picked, checked and packed. It ships within a day.', 'mi-trends-core' ),
			'shipped'   => __( 'Your order is on its way. Tracking details are below.', 'mi-trends-core' ),
			'delivered' => __( 'Your order has been delivered. Enjoy it — returns are easy for 30 days if anything isn’t right.', 'mi-trends-core' ),
			'returned'  => __( 'We’ve received your return. Refunds reach your original payment method within 5–7 business days.', 'mi-trends-core' ),
		);
		return isset( $messages[ $this->status ] ) ? $messages[ $this->status ] : '';
	}

	/**
	 * Send.
	 *
	 * @param int           $order_id Order.
	 * @param WC_Order|bool $order    Order.
	 */
	public function trigger( $order_id, $order = false ) {
		$this->setup_locale();

		if ( $order_id && ! is_a( $order, 'WC_Order' ) ) {
			$order = wc_get_order( $order_id );
		}
		if ( is_a( $order, 'WC_Order' ) ) {
			$this->object                         = $order;
			$this->status                         = $order->get_status();
			$this->recipient                      = $order->get_billing_email();
			$this->placeholders['{order_number}'] = $order->get_order_number();
			$this->placeholders['{status}']       = strtolower( wc_get_order_status_name( $this->status ) );
		}

		if ( $this->is_enabled() && $this->get_recipient() ) {
			$this->send( $this->get_recipient(), $this->get_subject(), $this->get_content(), $this->get_headers(), $this->get_attachments() );
		}

		$this->restore_locale();
	}

	/**
	 * HTML body.
	 *
	 * @return string
	 */
	public function get_content_html() {
		return wc_get_template_html(
			$this->template_html,
			array(
				'order'              => $this->object,
				'email_heading'      => $this->get_heading(),
				'status_message'     => $this->status_message(),
				'additional_content' => $this->get_additional_content(),
				'sent_to_admin'      => false,
				'plain_text'         => false,
				'email'              => $this,
			),
			'',
			$this->template_base
		);
	}

	/**
	 * Plain body.
	 *
	 * @return string
	 */
	public function get_content_plain() {
		return wc_get_template_html(
			$this->template_plain,
			array(
				'order'              => $this->object,
				'email_heading'      => $this->get_heading(),
				'status_message'     => $this->status_message(),
				'additional_content' => $this->get_additional_content(),
				'sent_to_admin'      => false,
				'plain_text'         => true,
				'email'              => $this,
			),
			'',
			$this->template_base
		);
	}
}
