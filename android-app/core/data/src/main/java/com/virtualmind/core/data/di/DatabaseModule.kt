package com.virtualmind.core.data.di

import android.content.Context
import androidx.room.Room
import com.virtualmind.core.data.local.VirtualMindDatabase
import com.virtualmind.core.data.local.dao.LogEntryDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

import com.virtualmind.core.data.local.dao.ContentItemDao
import com.virtualmind.core.data.local.dao.ProcessTaskDao

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun providesVirtualMindDatabase(
        @ApplicationContext context: Context
    ): VirtualMindDatabase {
        return Room.databaseBuilder(
            context,
            VirtualMindDatabase::class.java,
            "virtual_mind_database"
        )
        .fallbackToDestructiveMigration()
        .build()
    }

    @Provides
    fun providesLogEntryDao(
        database: VirtualMindDatabase
    ): LogEntryDao = database.logEntryDao()

    @Provides
    fun providesContentItemDao(
        database: VirtualMindDatabase
    ): ContentItemDao = database.contentItemDao()

    @Provides
    fun providesProcessTaskDao(
        database: VirtualMindDatabase
    ): ProcessTaskDao = database.processTaskDao()

    @Provides
    fun providesWorkoutDao(
        database: VirtualMindDatabase
    ): com.virtualmind.core.data.local.dao.WorkoutDao = database.workoutDao()
}
