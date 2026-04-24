from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from inventory.models import Product, StockMovement

User = get_user_model()


class WeightedAverageTest(TestCase):
    """
    Verifica el cálculo del promedio ponderado móvil de unit_price.
    Este cálculo impacta directamente el costo de materiales en OTs y reportes financieros.
    """

    def setUp(self):
        self.user = User.objects.create_user(username='inv_user', password='pass')
        self.product = Product.objects.create(
            name='Vinilo Test',
            kind='material',
            unit='metros',
        )

    def _move(self, qty, purchase_price=None):
        return StockMovement.objects.create(
            product=self.product,
            qty=qty,
            reason='test',
            purchase_price=purchase_price,
            created_by=self.user,
        )

    def test_first_purchase_sets_unit_price(self):
        self._move(Decimal('10'), purchase_price=Decimal('100'))
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_qty, Decimal('10'))
        self.assertEqual(self.product.unit_price, Decimal('100'))

    def test_second_purchase_recalculates_weighted_average(self):
        # 10 @ $100 + 10 @ $200 → promedio = $150
        self._move(Decimal('10'), purchase_price=Decimal('100'))
        self._move(Decimal('10'), purchase_price=Decimal('200'))
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_qty, Decimal('20'))
        self.assertEqual(self.product.unit_price, Decimal('150'))

    def test_egress_does_not_change_unit_price(self):
        self._move(Decimal('10'), purchase_price=Decimal('100'))
        self._move(Decimal('-3'))
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_qty, Decimal('7'))
        self.assertEqual(self.product.unit_price, Decimal('100'))

    def test_egress_records_unit_price_snapshot(self):
        # El snapshot permite calcular el costo real de materiales usados en una OT
        self._move(Decimal('10'), purchase_price=Decimal('100'))
        egress = self._move(Decimal('-5'))
        egress.refresh_from_db()
        self.assertEqual(egress.unit_price_snapshot, Decimal('100'))

    def test_purchase_without_price_does_not_set_unit_price(self):
        self._move(Decimal('10'))
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_qty, Decimal('10'))
        self.assertIsNone(self.product.unit_price)
