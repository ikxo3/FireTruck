from rest_framework import serializers
from .models import *
from django.contrib.auth.hashers import make_password

class SallerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Saller
        fields = '__all__'
        read_only_fields = ['id']
class SaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sale
        fields = '__all__'
        read_only_fields = ['id' ,'saller']
class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'
        read_only_fields = ['id']
class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Saller
        fields = '__all__'
        extra_kwargs = {
            'username': {'required': True, 'max_length': 30},
            'first_name': {'required': True, 'max_length': 100},
            'last_name': {'required': True, 'max_length': 100},
            'phone': {'required': True, 'max_length': 10},
            'expire_date': {'required': True}
        }
    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return Saller.objects.create(**validated_data)
    
