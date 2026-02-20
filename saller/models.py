from django.db import models
from django.contrib.auth.hashers import check_password ,make_password
from django.contrib.auth.models import AbstractBaseUser
from datetime import date, timedelta
def three_years_from_now():
    return date.today() + timedelta(days=4*365)

class Saller(AbstractBaseUser):
    username = models.CharField(max_length=30, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    expire_date = models.DateField(default=three_years_from_now)
    password = models.CharField(max_length=128) 
    email = models.EmailField(unique=True) 
    USERNAME_FIELD = 'email'  
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    def __str__(self):
        return self.username
    def set_password(self, raw_password):
        self.password = make_password(raw_password)
        self.save()
    
    def check_password(self, raw_password):
        return check_password(raw_password, self.password)
    
    def __str__(self):
        return self.username

class Company(models.Model):
    Company_name = models.CharField(max_length=300)
    costumer_name = models.CharField(max_length=30)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    bottel_type = models.CharField(max_length=50)
    bottel_size = models.CharField(max_length=50) 
    expire_date_bottel = models.DateField()
    saller = models.ForeignKey(Saller, on_delete=models.CASCADE)

    def __str__(self):
        return self.Company_name


class Sale(models.Model):
    saller = models.ForeignKey(Saller, on_delete=models.DO_NOTHING)
    costumer_name = models.CharField(max_length=30)
    costumer_phone = models.CharField(max_length=15)
    company_name = models.CharField(max_length=300)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    bottel_type = models.CharField(max_length=50)
    bottel_size = models.CharField(max_length=50)  
    expire_date_bottel = models.DateField()
    sale_date = models.DateField(auto_now_add=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)  

        # علشان ما يعملش تكرار بيانات
        Company.objects.get_or_create(
            Company_name=self.company_name,
            costumer_name=self.costumer_name,
            price=self.price,
            bottel_type=self.bottel_type,
            bottel_size=self.bottel_size,
            expire_date_bottel=self.expire_date_bottel,
            saller=self.saller
        )

    def __str__(self):
        return f"{self.costumer_name} - {self.company_name}"
