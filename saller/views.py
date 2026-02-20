from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Sum  # تم التصحيح هنا
from .serializer import *
from rest_framework_simplejwt.tokens import RefreshToken
from .models import *
from rest_framework.decorators import action
from datetime import date, timedelta

        
class AuthViewSet(viewsets.ModelViewSet):
    queryset = Saller.objects.none() 
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)  # تم التصحيح هنا
            return Response(
                {"refresh": str(refresh),  # تم التصحيح هنا
                 "access": str(refresh.access_token),
                 "user": SallerSerializer(user).data},  # تم التصحيح هنا
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)  # تم التصحيح هنا
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        try:
            user = Saller.objects.get(email=email)
            if user.expire_date < date.today():
                return Response(
                                {"detail": "Your account has expired. Please contact administrator."}, 
                                status=status.HTTP_403_FORBIDDEN)
        except Saller.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if not user.check_password(password):
            return Response({"detail": "Invalid password"}, status=status.HTTP_400_BAD_REQUEST)
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': SallerSerializer(user).data  # إضافة بيانات المستخدم في الرد
        }, status=status.HTTP_200_OK)
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        user = request.user
        serializer = SallerSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        refresh_token = request.data.get('refresh')  # تم التصحيح هنا
        if not refresh_token:
            return Response({"detail": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Successfully logged out"}, status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Sale.objects.filter(Saller =self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(saller=self.request.user)
    @action(detail=False, methods=['get'])
    def total_income(self, request):
        total = Sale.objects.filter(saller=request.user).aggregate(Sum('price'))['price__sum'] or 0
        return Response({'total_income': total}, status=status.HTTP_200_OK)
    @action(detail=False, methods=['get'])
    def Expiration_Near(self, request):   
        today = date.today()
        soon = today + timedelta(days=30)
        sales = Sale.objects.filter(saller=request.user, expire_date_bottel__range=[today, soon])
        serializer = self.get_serializer(sales, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    @action(detail=False, methods=['get'])
    def today_sales(self, request):
        today = date.today()
        sales = Sale.objects.filter(sale_date=today, saller=request.user)  # تم التصحيح هنا
        serializer = self.get_serializer(sales, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def search_costumer(self, request):
        keyword = request.query_params.get('q', None)
        if keyword:
            sales = Sale.objects.filter(saller=request.user, costumer_name__icontains=keyword)
            serializer = self.get_serializer(sales, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response({"detail": "No keyword provided"}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def validate_sale(self, request):
        serializer = SaleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(saller=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'])
    def delete_sale(self, request, pk):
        sale = get_object_or_404(Sale, pk=pk, saller=request.user)
        sale.delete()
        return Response({"detail": "Sale deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['put'])
    def update_sale(self, request, pk=None):
        sale = get_object_or_404(Sale, pk=pk, saller=request.user)
        serializer = SaleSerializer(sale, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def expiring_soon_sales(self, request):
        today = date.today()
        soon = today + timedelta(days=30)
        sales = Sale.objects.filter(saller=request.user, expire_date_bottel__range=[today, soon]
        )
        serializer = self.get_serializer(sales, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK) 
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        today = date.today()
        
        # إحصائيات المبيعات اليوم
        today_sales = Sale.objects.filter(
            saller=request.user, 
            sale_date=today
        ).count()
        
        # إجمالي الإيرادات
        total_revenue = Sale.objects.filter(
            saller=request.user
        ).aggregate(Sum('price'))['price__sum'] or 0
        
        # العناصر القريبة من الانتهاء
        soon = today + timedelta(days=30)
        expiring_soon = Sale.objects.filter(
            saller=request.user, 
            expire_date_bottel__range=[today, soon]
        ).count()
        
        return Response({
            'today_sales': today_sales,
            'total_revenue': total_revenue,
            'expiring_soon': expiring_soon
        }, status=status.HTTP_200_OK)
        
        
        
from django.shortcuts import render

def landing_view(request):
    return render(request, "landing.html")

def login_view(request):
    return render(request, "login.html")

def register_view(request):
    return render(request, "register.html")

def index_view(request):
    return render(request, "index.html")
