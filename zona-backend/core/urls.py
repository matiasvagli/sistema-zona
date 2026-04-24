from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

from accounts.views import UserViewSet, SectorMembershipViewSet
from clients.views import ClientViewSet
from inventory.views import ProductViewSet, StockMovementViewSet, MaterialReservationViewSet, PurchaseRequestViewSet
from finanzas.views import ExpenseViewSet, SupplierViewSet, SupplierInvoiceViewSet
from budgets.views import BudgetViewSet, BudgetItemViewSet
from work_orders.views import WorkOrderViewSet, WorkOrderNotificationViewSet
from production.views import SectorViewSet, SectorTaskViewSet
from spaces.views import AdSpaceViewSet, SpaceRentalViewSet
from campaigns.views import CampaignViewSet, CampaignSpaceViewSet
from employees.views import EmployeeViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'sector-memberships', SectorMembershipViewSet)
router.register(r'clients', ClientViewSet)
router.register(r'products', ProductViewSet)
router.register(r'stock-movements', StockMovementViewSet)
router.register(r'material-reservations', MaterialReservationViewSet)
router.register(r'purchase-requests', PurchaseRequestViewSet)
router.register(r'budgets', BudgetViewSet)
router.register(r'budget-items', BudgetItemViewSet)
router.register(r'work-orders', WorkOrderViewSet)
router.register(r'work-order-notifications', WorkOrderNotificationViewSet, basename='work-order-notification')
router.register(r'sectors', SectorViewSet)
router.register(r'sector-tasks', SectorTaskViewSet)
router.register(r'ad-spaces', AdSpaceViewSet)
router.register(r'space-rentals', SpaceRentalViewSet)
router.register(r'campaigns', CampaignViewSet)
router.register(r'campaign-spaces', CampaignSpaceViewSet)
router.register(r'employees', EmployeeViewSet)
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'suppliers', SupplierViewSet)
router.register(r'supplier-invoices', SupplierInvoiceViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth
    path('api/v1/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # API
    path('api/v1/', include(router.urls)),
    path('api/v1/', include('chat.urls')),
    path('api/v1/notifications/', include('notifications.urls')),

    # Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
