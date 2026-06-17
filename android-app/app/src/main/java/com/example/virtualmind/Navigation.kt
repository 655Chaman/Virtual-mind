package com.example.virtualmind

import androidx.compose.runtime.Composable
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.ui.NavDisplay
import com.example.virtualmind.ui.main.MainScreen

@Composable
fun MainNavigation() {
  val backStack = rememberNavBackStack(Main)

  NavDisplay(
    backStack = backStack,
    onBack = { backStack.removeLastOrNull() },
    entryProvider =
      entryProvider {
        entry<Main> {
          MainScreen(onItemClick = { navKey -> backStack.add(navKey) })
        }
        entry<DeenPage> {
          com.example.virtualmind.ui.deen.DeenScreen(onBack = { backStack.removeLastOrNull() })
        }
        entry<FitnessPage> {
          com.example.virtualmind.ui.fitness.FitnessScreen(onBack = { backStack.removeLastOrNull() })
        }
        entry<RecoveryPage> {
          com.example.virtualmind.ui.recovery.RecoveryScreen(onBack = { backStack.removeLastOrNull() })
        }
        entry<PhysicalityHubPage> {
          com.example.virtualmind.ui.physicality.PhysicalityScreen(
            onWorkoutClick = { backStack.add(FitnessPage) },
            onRecoveryClick = { backStack.add(RecoveryPage) },
            onBack = { backStack.removeLastOrNull() }
          )
        }
        entry<SelfPage> {
          com.example.virtualmind.ui.self.SelfScreen(onBack = { backStack.removeLastOrNull() })
        }
      },
  )
}
