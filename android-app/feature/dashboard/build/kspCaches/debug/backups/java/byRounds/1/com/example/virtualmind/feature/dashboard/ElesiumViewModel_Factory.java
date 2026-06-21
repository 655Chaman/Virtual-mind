package com.example.virtualmind.feature.dashboard;

import com.virtualmind.core.data.local.dao.ContentItemDao;
import com.virtualmind.core.data.local.dao.ProcessTaskDao;
import com.virtualmind.core.network.FitnessApi;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Provider;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata
@QualifierMetadata
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava",
    "cast",
    "deprecation",
    "nullness:initialization.field.uninitialized"
})
public final class ElesiumViewModel_Factory implements Factory<ElesiumViewModel> {
  private final Provider<ContentItemDao> contentDaoProvider;

  private final Provider<ProcessTaskDao> processDaoProvider;

  private final Provider<FitnessApi> fitnessApiProvider;

  public ElesiumViewModel_Factory(Provider<ContentItemDao> contentDaoProvider,
      Provider<ProcessTaskDao> processDaoProvider, Provider<FitnessApi> fitnessApiProvider) {
    this.contentDaoProvider = contentDaoProvider;
    this.processDaoProvider = processDaoProvider;
    this.fitnessApiProvider = fitnessApiProvider;
  }

  @Override
  public ElesiumViewModel get() {
    return newInstance(contentDaoProvider.get(), processDaoProvider.get(), fitnessApiProvider.get());
  }

  public static ElesiumViewModel_Factory create(Provider<ContentItemDao> contentDaoProvider,
      Provider<ProcessTaskDao> processDaoProvider, Provider<FitnessApi> fitnessApiProvider) {
    return new ElesiumViewModel_Factory(contentDaoProvider, processDaoProvider, fitnessApiProvider);
  }

  public static ElesiumViewModel newInstance(ContentItemDao contentDao, ProcessTaskDao processDao,
      FitnessApi fitnessApi) {
    return new ElesiumViewModel(contentDao, processDao, fitnessApi);
  }
}
