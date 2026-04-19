from django.test import TestCase
from clients.models import Client
from inventory.models import Product
from budgets.models import Budget, BudgetItem
from django.contrib.auth import get_user_model

User = get_user_model()

class BudgetCalculationTest(TestCase):
    def setUp(self):
        self.client = Client.objects.create(name="Cliente Test")
        self.user = User.objects.create_user(username="admin", password="password")
        self.product = Product.objects.create(name="Vinilo", unit="m2")

    def test_total_calculation(self):
        budget = Budget.objects.create(
            client=self.client,
            created_by=self.user
        )
        
        # Agregar ítem: 5m2 de Vinilo a 1000 c/u = 5000
        BudgetItem.objects.create(
            budget=budget,
            product=self.product,
            description="Vinilo impreso",
            qty=5,
            unit_price=1000
        )
        
        # Agregar otro ítem: 2m2 de Vinilo a 1500 c/u = 3000
        BudgetItem.objects.create(
            budget=budget,
            product=self.product,
            description="Vinilo de corte",
            qty=2,
            unit_price=1500
        )

        # El total debe ser 8000
        budget.refresh_from_db()
        self.assertEqual(budget.total_amount, 8000)
