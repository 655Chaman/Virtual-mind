package com.virtualmind.core.network.di

import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

import com.virtualmind.core.network.DeenApi
import com.virtualmind.core.network.FitnessApi
import com.virtualmind.core.network.LogsApi
import com.virtualmind.core.network.OracleApi
import com.virtualmind.core.network.WellnessApi

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun providesOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .readTimeout(120, TimeUnit.SECONDS)
            .connectTimeout(120, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun providesRetrofit(okHttpClient: OkHttpClient): retrofit2.Retrofit {
        return retrofit2.Retrofit.Builder()
            .baseUrl("https://virtual-mind.onrender.com/")
            .client(okHttpClient)
            .addConverterFactory(retrofit2.converter.gson.GsonConverterFactory.create())
            .build()
    }

    @Provides
    @Singleton
    fun providesOracleApi(retrofit: retrofit2.Retrofit): OracleApi {
        return retrofit.create(OracleApi::class.java)
    }

    @Provides
    @Singleton
    fun providesFitnessApi(retrofit: retrofit2.Retrofit): FitnessApi {
        return retrofit.create(FitnessApi::class.java)
    }

    @Provides
    @Singleton
    fun providesDeenApi(retrofit: retrofit2.Retrofit): DeenApi {
        return retrofit.create(DeenApi::class.java)
    }

    @Provides
    @Singleton
    fun providesLogsApi(retrofit: retrofit2.Retrofit): LogsApi {
        return retrofit.create(LogsApi::class.java)
    }

    @Provides
    @Singleton
    fun providesWellnessApi(retrofit: retrofit2.Retrofit): WellnessApi {
        return retrofit.create(WellnessApi::class.java)
    }
}
