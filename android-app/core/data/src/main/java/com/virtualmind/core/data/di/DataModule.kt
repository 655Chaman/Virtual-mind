package com.virtualmind.core.data.di

import com.virtualmind.core.data.repository.LogRepository
import com.virtualmind.core.data.repository.OfflineFirstLogRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@Module
@InstallIn(SingletonComponent::class)
abstract class DataModule {

    @Binds
    abstract fun bindsLogRepository(
        logRepository: OfflineFirstLogRepository
    ): LogRepository
}
